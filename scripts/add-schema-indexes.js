const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

// Normalize line endings to LF for consistent replacement
const isCRLF = content.includes('\r\n');
if (isCRLF) {
  content = content.replace(/\r\n/g, '\n');
}

// 1. Session
content = content.replace(
  '  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@map("session")',
  '  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@map("session")'
);

// 2. Member
content = content.replace(
  '  @@unique([organizationId, userId])\n  @@map("member")',
  '  @@unique([organizationId, userId])\n  @@index([userId])\n  @@map("member")'
);

// 3. Property
content = content.replace(
  '  @@index([organizationId, suburb])\n  @@map("property")',
  '  @@index([organizationId, suburb])\n  @@index([organizationId, createdAt])\n  @@index([assignedAgentId])\n  @@map("property")'
);

// 4. Inquiry
content = content.replace(
  '  @@index([propertyId])\n  @@map("inquiry")',
  '  @@index([propertyId])\n  @@index([organizationId, createdAt])\n  @@index([assignedAgentId])\n  @@map("inquiry")'
);

// 5. Transaction
content = content.replace(
  '  @@index([organizationId, status])\n  @@map("transaction")',
  '  @@index([organizationId, status])\n  @@index([organizationId, createdAt])\n  @@index([propertyId])\n  @@index([closingAgentId])\n  @@map("transaction")'
);

// 6. LandlordStatement
content = content.replace(
  '  @@index([organizationId, statementYear, statementMonth])\n  @@map("landlord_statement")',
  '  @@index([organizationId, statementYear, statementMonth])\n  @@index([organizationId, status])\n  @@map("landlord_statement")'
);

if (isCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(schemaPath, content, 'utf8');
console.log('Database indexes successfully added to schema.prisma');
