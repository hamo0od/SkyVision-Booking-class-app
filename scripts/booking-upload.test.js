const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const { pathToFileURL } = require("node:url")
const ts = require("typescript")

function compileModule(sourcePath, outputPath, replacements = []) {
  let source = fs.readFileSync(sourcePath, "utf8")

  for (const [from, to] of replacements) {
    source = source.replaceAll(from, to)
  }

  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: path.basename(sourcePath),
    reportDiagnostics: true,
  })

  if (output.diagnostics && output.diagnostics.length > 0) {
    throw new Error(ts.formatDiagnosticsWithColorAndContext(output.diagnostics, {
      getCanonicalFileName: (name) => name,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => "\n",
    }))
  }

  fs.writeFileSync(outputPath, output.outputText, "utf8")
}

async function loadModules() {
  const tempDir = path.join(process.cwd(), ".tmp-booking-upload-test")
  fs.rmSync(tempDir, { recursive: true, force: true })
  fs.mkdirSync(tempDir, { recursive: true })
  const bookingUploadPath = path.join(tempDir, "booking-upload.mjs")
  const bookingUploadServerPath = path.join(tempDir, "booking-upload-server.mjs")

  compileModule(
    path.join(process.cwd(), "lib", "booking-upload.ts"),
    bookingUploadPath,
  )
  compileModule(
    path.join(process.cwd(), "lib", "booking-upload-server.ts"),
    bookingUploadServerPath,
    [["@/lib/booking-upload", "./booking-upload.mjs"]],
  )

  const bookingUpload = await import(pathToFileURL(bookingUploadPath).href)
  const bookingUploadServer = await import(pathToFileURL(bookingUploadServerPath).href)

  return { bookingUpload, bookingUploadServer, tempDir }
}

async function runTest(name, fn) {
  try {
    await fn()
    console.log(`PASS ${name}`)
  } catch (error) {
    console.error(`FAIL ${name}`)
    throw error
  }
}

async function main() {
  const { bookingUpload, bookingUploadServer, tempDir } = await loadModules()
  const {
    BOOKING_UPLOAD_CHUNK_SIZE_BYTES,
    MAX_TOTAL_BOOKING_UPLOAD_SIZE_BYTES,
    getBookingUploadValidationError,
  } = bookingUpload
  const {
    appendBookingUploadChunk,
    cleanupBookingUpload,
    consumeBookingUpload,
  } = bookingUploadServer

  await runTest("allows two 1MB PDFs within the combined upload limit", () => {
    const oneMb = 1024 * 1024
    const validationError = getBookingUploadValidationError([
      {
        file: new File([Buffer.alloc(oneMb)], "ecaa.pdf", { type: "application/pdf" }),
        label: "ECAA approval PDF file",
      },
      {
        file: new File([Buffer.alloc(oneMb)], "training.pdf", { type: "application/pdf" }),
        label: "Training order PDF file",
      },
    ])

    assert.equal(validationError, null)
  })

  await runTest("rejects uploads that exceed the combined upload limit", () => {
    const tooLarge = Math.ceil(MAX_TOTAL_BOOKING_UPLOAD_SIZE_BYTES / 2) + 1
    const validationError = getBookingUploadValidationError([
      {
        file: new File([Buffer.alloc(tooLarge)], "ecaa.pdf", { type: "application/pdf" }),
        label: "ECAA approval PDF file",
      },
      {
        file: new File([Buffer.alloc(tooLarge)], "training.pdf", { type: "application/pdf" }),
        label: "Training order PDF file",
      },
    ])

    assert.match(validationError || "", /combined size/)
  })

  await runTest("assembles a multi-megabyte PDF from sub-1MB chunks", async () => {
    const uploadId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const pdfBuffer = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(2 * 1024 * 1024, 65)])
    const totalChunks = Math.ceil(pdfBuffer.length / BOOKING_UPLOAD_CHUNK_SIZE_BYTES)
    let uploadToken = null

    try {
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
        const start = chunkIndex * BOOKING_UPLOAD_CHUNK_SIZE_BYTES
        const end = Math.min(start + BOOKING_UPLOAD_CHUNK_SIZE_BYTES, pdfBuffer.length)
        const result = await appendBookingUploadChunk({
          uploadId,
          fileName: "proof.pdf",
          mimeType: "application/pdf",
          totalChunks,
          chunkIndex,
          chunk: pdfBuffer.subarray(start, end),
        })

        if (chunkIndex === totalChunks - 1) {
          assert.equal(result.completed, true)
          assert.ok(result.uploadToken)
          uploadToken = result.uploadToken
        } else {
          assert.equal(result.completed, false)
        }
      }

      assert.ok(uploadToken)
      const uploadedFile = await consumeBookingUpload(uploadToken)
      assert.equal(uploadedFile.fileName, "proof.pdf")
      assert.deepEqual(uploadedFile.buffer, pdfBuffer)
      await uploadedFile.cleanup()
      uploadToken = null
    } finally {
      await cleanupBookingUpload(uploadToken)
    }
  })

  console.log("All booking upload tests passed.")
  fs.rmSync(tempDir, { recursive: true, force: true })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
