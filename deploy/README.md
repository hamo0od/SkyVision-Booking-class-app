# Ubuntu and Nginx deployment

These files target Ubuntu 24.04, Node.js 20 LTS or newer, PostgreSQL, systemd, Nginx, and Certbot. Replace `booking.example.com` everywhere with the real DNS name before enabling the site.

## 1. Install host dependencies

```bash
sudo apt update
sudo apt install -y nginx postgresql postgresql-contrib certbot python3-certbot-nginx
# Install Node.js 20 LTS or newer from NodeSource or your managed package source.
node --version
npm --version
```

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin skyvision
sudo mkdir -p /var/www/skyvision/app /etc/skyvision
sudo chown -R skyvision:skyvision /var/www/skyvision
sudo chmod 750 /etc/skyvision
```

## 2. Configure PostgreSQL and secrets

Create a database and database user with a unique password. Put the three values from `.env.example` in `/etc/skyvision/skyvision.env`, set the public HTTPS URL, then protect the file:

```bash
openssl rand -base64 32
sudo chown root:skyvision /etc/skyvision/skyvision.env
sudo chmod 640 /etc/skyvision/skyvision.env
```

Do not copy the development `.env` to the VPS or commit it.

## 3. Build and initialize

Copy the repository to `/var/www/skyvision/app`, excluding `.env`, `.next`, `node_modules`, and `uploads`. Then run:

```bash
cd /var/www/skyvision/app
sudo -u skyvision npm ci
sudo -u skyvision npm run typecheck
sudo -u skyvision npm run lint
sudo -u skyvision bash -c 'set -a; source /etc/skyvision/skyvision.env; set +a; npm run db:migrate'
sudo -u skyvision bash -c 'set -a; source /etc/skyvision/skyvision.env; set +a; npm run build'
sudo -u skyvision mkdir -p uploads/bookings uploads/tmp/bookings
```

For an existing database previously managed with `prisma db push`, first verify that its schema matches this repository, then run `npx prisma migrate resolve --applied 20260721000000_init`. Do not apply the initial migration over tables that already exist.

## 4. Enable systemd and Nginx

Start with the HTTP-only configuration so Nginx can load before certificates exist. After Certbot issues the certificate, replace it with the hardened TLS configuration:

```bash
sudo cp deploy/systemd/skyvision.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now skyvision
sudo cp deploy/nginx/skyvision-http.conf /etc/nginx/sites-available/skyvision
sudo ln -s /etc/nginx/sites-available/skyvision /etc/nginx/sites-enabled/skyvision
sudo nginx -t
sudo systemctl reload nginx
sudo certbot certonly --nginx -d booking.example.com
sudo cp deploy/nginx/skyvision.conf /etc/nginx/sites-available/skyvision
sudo nginx -t
sudo systemctl reload nginx
```

Allow only SSH, HTTP, and HTTPS through the firewall. Port 3000 is bound to `127.0.0.1` and must not be exposed publicly.

## Updates and rollback

Back up PostgreSQL and `uploads/` before each release. Run `npm ci`, checks, migrations, and the build before restarting. Keep the previous application release and database backup until sign-in, booking, approval, upload, and file-access smoke tests pass.

```bash
sudo systemctl restart skyvision
sudo systemctl status skyvision --no-pager
sudo journalctl -u skyvision -n 100 --no-pager
```