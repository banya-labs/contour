# Contour Real Estate OS: Dify MCP (Model Context Protocol) Connection Guide

This guide explains how to connect your **Dify Agent** directly to Contour via **MCP (Model Context Protocol)** with **zero manual tool coding**, connecting Dify directly to **Neon PostgreSQL** and **MinIO S3 Object Storage**.

---

## ⚡ Why MCP?
With MCP, Dify discovers all 5 tools, schemas, and descriptions automatically over standard JSON-RPC 2.0 / SSE stream from Contour.

---

## 🔌 1-Minute Connection in Dify

### Step 1: In Dify UI
1. Go to **Tools** in the top navigation bar.
2. Select **MCP (Model Context Protocol)**.
3. Click **+ Add MCP Server**.

### Step 2: Configure Server Details
- **Server Name**: `contour`
- **Server URL**:
  - **Production**: `https://contour.banyalabs.com/api/mcp` (or SSE: `https://contour.banyalabs.com/api/mcp/sse`)
  - **Local Dev**: `http://localhost:3000/api/mcp`
- **Transport Type**: `SSE` or `Streamable HTTP`
- **Headers / Authentication**:
  - **Key**: `Authorization`
  - **Value**: `Bearer your-api-key-or-dify-tool-secret` (e.g. `banya_live_xxx` or `DIFY_TOOL_SECRET`)

4. Click **Save & Connect**.

---

## 🛠️ Auto-Discovered Tools in Dify

The moment you click Save, Dify will automatically register all 5 tools:

| MCP Tool | Data Source | Tenant Isolation Guarantee |
| :--- | :--- | :--- |
| **`search_properties`** | **Neon PostgreSQL** | Queries `Property` table strictly with `where: { organizationId }`. |
| **`get_rental_arrears`** | **Neon PostgreSQL** | Calculates overdue rent & days past due for the active organization. |
| **`get_revenue_commission`** | **Neon PostgreSQL** | Computes gross sales, 5% agency commissions, and 50% closing splits. |
| **`get_property_documents`** | **MinIO S3** | Returns 15-min POPIA presigned download URLs strictly scoped to `s3://contour-vault/{organizationId}/`. |
| **`create_inquiry_or_lead`** | **Neon PostgreSQL** | Ingests buyer CRM inquiries with a 30-day anti-poaching lock. |

---

## 🤖 Step 3: Attach MCP Tools to Your Dify Agent

1. Open your **Dify Agent / Chatflow** in **Studio**.
2. Click **Tools** $\rightarrow$ Click **Add Tool**.
3. Under the **contour** MCP provider, toggle all 5 tools **ON**.
4. In the System Prompt, specify:
   ```markdown
   Always pass the tenant's organization_id into tool calls.
   Currencies: Zambian Kwacha (ZMW / K) or USD ($).
   Agency commission is 5% on sales and 10% on rental management.
   All MinIO S3 document links expire after 15 minutes.
   ```
5. Click **Publish** $\rightarrow$ **Update**.

---

## 🧪 Verification Command

Verify the MCP endpoint on your server:
```bash
npx tsx scripts/test-mcp-dify.ts
```
All tests should return **100% PASS**.
