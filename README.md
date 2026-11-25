# Shristi literature club template

Install Bun, open this folder in a terminal and run `bun install`. Build with `bun --bun run build`, then run `bun start` and visit http://localhost:3000. For live editing run `bun --bun run dev`.

Edit the club identity and the three lists in lib/club.js. Each entries array accepts strings. Expand each index row to read its contents.

The production server accepts 1,500 in-flight requests across all routes in one process. Overflow receives HTTP 503 with Retry-After. Run a single instance for this limit. Static CDN hosting (including Vercel static deployments) bypasses this server and requires an independent ingress concurrency limit. Development mode also bypasses the limit.

This bare template contains no accounts, forms or database. The reference archive is excluded from Git and Vercel uploads.
