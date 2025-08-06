"use client"

import { useState } from "react"
import { Download, Calendar, TrendingUp, Package, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import MainLayout from "@/components/layout/main-layout"

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<any>(null)
  const [reportType, setReportType] = useState("stock-movement")

  // Mock report data
  const stockMovementData = [
    {
      date: "2024-01-15",
      material: "Hydraulic Seal Kit",
      partNumber: "HYD-001",
      type: "Issue",
      quantity: 2,
      requestedBy: "Mike Johnson",
      issuedBy: "Sarah Store",
    },
    {
      date: "2024-01-15",
      material: "Engine Oil Filter",
      partNumber: "ENG-045",
      type: "Return",
      quantity: 1,
      requestedBy: "Tom Wilson",
      issuedBy: "Sarah Store",
    },
  ]

  const lowStockData = [
    {
      partNumber: "HYD-001",
      name: "Hydraulic Seal Kit",
      currentStock: 2,
      minimumLevel: 10,
      location: "A-12-B",
      daysLow: 5,
    },
    {
      partNumber: "ENG-045",
      name: "Engine Oil Filter",
      currentStock: 5,
      minimumLevel: 15,
      location: "B-08-C",
      daysLow: 2,
    },
  ]

  const toolUsageData = [
    {
      toolName: "Torque Wrench 50-250 Nm",
      partNumber: "TRQ-001",
      technician: "Mike Johnson",
      issuedDate: "2024-01-10",
      returnDate: "2024-01-12",
      daysUsed: 2,
      purpose: "Engine maintenance",
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Reports & Analytics</h2>
            <p className="text-muted-foreground">Generate and view detailed reports on material usage and inventory</p>
          </div>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Report Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Report Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock-movement">Stock Movement</SelectItem>
                  <SelectItem value="low-stock">Low Stock Items</SelectItem>
                  <SelectItem value="tool-usage">Tool Usage</SelectItem>
                  <SelectItem value="requests-summary">Requests Summary</SelectItem>
                  <SelectItem value="calibration-due">Calibration Due</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex-1">
                <DatePickerWithRange date={dateRange} setDate={setDateRange} placeholder="Select date range" />
              </div>
              <Button>Generate Report</Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Content */}
        <Tabs value={reportType} onValueChange={setReportType}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="stock-movement">Stock Movement</TabsTrigger>
            <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
            <TabsTrigger value="tool-usage">Tool Usage</TabsTrigger>
            <TabsTrigger value="requests-summary">Requests</TabsTrigger>
            <TabsTrigger value="calibration-due">Calibration</TabsTrigger>
          </TabsList>

          <TabsContent value="stock-movement" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Stock Movement Report
                </CardTitle>
                <CardDescription>Track all material issues and returns over the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Part Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Issued By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockMovementData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>{item.material}</TableCell>
                        <TableCell>{item.partNumber}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              item.type === "Issue" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                            }`}
                          >
                            {item.type}
                          </span>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.requestedBy}</TableCell>
                        <TableCell>{item.issuedBy}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="low-stock" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Low Stock Items Report
                </CardTitle>
                <CardDescription>Items currently below minimum stock levels</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part Number</TableHead>
                      <TableHead>Material Name</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Minimum Level</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Days Below Min</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.partNumber}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-red-600 font-medium">{item.currentStock}</TableCell>
                        <TableCell>{item.minimumLevel}</TableCell>
                        <TableCell>{item.location}</TableCell>
                        <TableCell>{item.daysLow} days</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tool-usage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Tool Usage Report
                </CardTitle>
                <CardDescription>Track tool usage by technicians over the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tool Name</TableHead>
                      <TableHead>Part Number</TableHead>
                      <TableHead>Technician</TableHead>
                      <TableHead>Issued Date</TableHead>
                      <TableHead>Return Date</TableHead>
                      <TableHead>Days Used</TableHead>
                      <TableHead>Purpose</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {toolUsageData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.toolName}</TableCell>
                        <TableCell>{item.partNumber}</TableCell>
                        <TableCell>{item.technician}</TableCell>
                        <TableCell>{item.issuedDate}</TableCell>
                        <TableCell>{item.returnDate}</TableCell>
                        <TableCell>{item.daysUsed}</TableCell>
                        <TableCell>{item.purpose}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests-summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Requests Summary</CardTitle>
                <CardDescription>Overview of material requests and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">24</div>
                    <p className="text-sm text-muted-foreground">Total Requests</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">8</div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">14</div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">2</div>
                    <p className="text-sm text-muted-foreground">Rejected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calibration-due" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Calibration Due Report</CardTitle>
                <CardDescription>Tools requiring calibration or overdue for return</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4" />
                  <p>No tools currently due for calibration</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
