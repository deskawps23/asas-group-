const ALLOWED_KEYS = [
  "personId", "eligible", "status", "reasonCode", 
  "validFrom", "validUntil", "issuedBy", "contractVersion", "signature"
];

function validateEligibilityPayload(payload) {
  const keys = Object.keys(payload);
  const hasIllegalKey = keys.some(key => !ALLOWED_KEYS.includes(key));
  
  if (hasIllegalKey) {
    throw new Error("SECURITY_VIOLATION: Payload contains forbidden fields.");
  }
  
  if (!["READY", "NOT_READY", "PENDING_VERIFICATION"].includes(payload.status)) {
    throw new Error("CONTRACT_VIOLATION: Invalid status value.");
  }
  
  return true;
}

function isExpired(validUntilIsoString) {
  if (!validUntilIsoString) return true;
  return new Date(validUntilIsoString).getTime() < Date.now();
}

export async function getEligibilityDecision(personId) {
  console.log(`[Eligibility] Meminta keputusan untuk personId: ${personId}`);
  
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const mockResponse = {
        personId: personId,
        eligible: true,
        status: "READY", 
        reasonCode: "OK",
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 3600000).toISOString(),
        issuedBy: "system-chro",
        contractVersion: "1.0.0",
        signature: "mock-signature-abc123"
      };

      try {
        validateEligibilityPayload(mockResponse);
        
        if (isExpired(mockResponse.validUntil)) {
           return resolve({ ...mockResponse, status: "PENDING_VERIFICATION", reasonCode: "EXPIRED" });
        }

        resolve(mockResponse);
      } catch (error) {
        reject(error);
      }
    }, 800); 
  });
}
