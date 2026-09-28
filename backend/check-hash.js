const { ethers } = require('ethers');
const fs = require('fs');

async function main() {
  const testString = "Hello, Land Registry! This is a test document.";
  const testFile = "test_document.txt";
  fs.writeFileSync(testFile, testString);

  // 1. Manually hash locally simulating the backend/frontend logic
  const fileBytes = fs.readFileSync(testFile);
  const expectedHash = ethers.keccak256(new Uint8Array(fileBytes));
  console.log("Expected Hash (Local computation):", expectedHash);

  // 2. Post to backend
  const formData = new FormData();
  // Using a Blob to simulate file upload in Node 18+
  const blob = new Blob([fileBytes], { type: 'text/plain' });
  formData.append('file', blob, testFile);

  const res = await fetch('http://localhost:3000/api/documents', {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    console.error("Backend returned error:", res.status, await res.text());
    process.exit(1);
  }

  const data = await res.json();
  console.log("Backend returned hash:          ", data.documentHash);

  if (data.documentHash === expectedHash) {
    console.log("✅ MATCH SUCCESSFUL");
  } else {
    console.error("❌ HASH MISMATCH");
  }

  fs.unlinkSync(testFile);
}

main().catch(console.error);
