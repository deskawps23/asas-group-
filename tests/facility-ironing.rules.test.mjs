import fs from "node:fs";
import test, {
  after,
  before,
  beforeEach
} from "node:test";

import assert from "node:assert/strict";

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from "@firebase/rules-unit-testing";

import {
  Timestamp,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc
} from "firebase/firestore";

const PROJECT_ID = "asas-corporate-rules-test";
const RULES_PATH = "firestore.rules";

const OWNER_UID = "customer-owner";
const OTHER_UID = "customer-other";
const ADMIN_UID = "asas-admin";

let testEnv;

function validOrder(overrides = {}) {
  return {
    ownerUid: OWNER_UID,

    serviceCategory: "LAUNDRY_GARMENT_CARE",
    serviceType: "IRONING",

    orderMode: "ONE_TIME",
    engagementType: "SAM_NON_CONTRACT",
    fulfillmentMode: "PICKUP_DELIVERY",

    marketArea: "PANDEGLANG",
    serviceZone: "ZONE_1",

    pickup: {
      address: "Alamat pickup valid Zona 1",
      requestedAt: Timestamp.fromDate(
        new Date("2030-01-01T08:00:00Z")
      )
    },

    customerNotes: "Pakaian sudah dalam kondisi bersih.",

    status: "REQUESTED",

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),

    ...overrides
  };
}

function ownerDb() {
  return testEnv
    .authenticatedContext(OWNER_UID)
    .firestore();
}

function otherDb() {
  return testEnv
    .authenticatedContext(OTHER_UID)
    .firestore();
}

function adminDb() {
  return testEnv
    .authenticatedContext(ADMIN_UID, {
      admin: true
    })
    .firestore();
}

function anonymousDb() {
  return testEnv
    .unauthenticatedContext()
    .firestore();
}

function orderRef(db, orderId) {
  return doc(db, "serviceOrders", orderId);
}

before(async () => {
  if (!fs.existsSync(RULES_PATH)) {
    throw new Error(
      `Rules file tidak ditemukan: ${RULES_PATH}`
    );
  }

  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,

    firestore: {
      rules: fs.readFileSync(
        RULES_PATH,
        "utf8"
      )
    }
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

after(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

test(
  "TC-RULE-01 valid Jasa Setrika Zona 1 dapat dibuat owner",
  async () => {
    const ref = orderRef(ownerDb(), "order-valid");

    await assertSucceeds(
      setDoc(ref, validOrder())
    );
  }
);

test(
  "TC-RULE-02 anonymous create ditolak",
  async () => {
    const ref = orderRef(
      anonymousDb(),
      "order-anonymous"
    );

    await assertFails(
      setDoc(ref, validOrder())
    );
  }
);

test(
  "TC-RULE-03 ownerUid berbeda dari auth UID ditolak",
  async () => {
    const ref = orderRef(
      otherDb(),
      "order-owner-mismatch"
    );

    await assertFails(
      setDoc(ref, validOrder())
    );
  }
);

test(
  "TC-RULE-04 serviceType LAUNDRY ditolak",
  async () => {
    const ref = orderRef(
      ownerDb(),
      "order-laundry"
    );

    await assertFails(
      setDoc(
        ref,
        validOrder({
          serviceType: "LAUNDRY"
        })
      )
    );
  }
);

test(
  "TC-RULE-05 serviceType LAUNDRY_IRONING ditolak",
  async () => {
    const ref = orderRef(
      ownerDb(),
      "order-laundry-ironing"
    );

    await assertFails(
      setDoc(
        ref,
        validOrder({
          serviceType: "LAUNDRY_IRONING"
        })
      )
    );
  }
);

test(
  "TC-RULE-06 market selain PANDEGLANG ditolak",
  async () => {
    const ref = orderRef(
      ownerDb(),
      "order-wrong-market"
    );

    await assertFails(
      setDoc(
        ref,
        validOrder({
          marketArea: "OTHER_MARKET"
        })
      )
    );
  }
);

test(
  "TC-RULE-07 zona selain ZONE_1 ditolak",
  async () => {
    const ref = orderRef(
      ownerDb(),
      "order-wrong-zone"
    );

    await assertFails(
      setDoc(
        ref,
        validOrder({
          serviceZone: "ZONE_2"
        })
      )
    );
  }
);

test(
  "TC-RULE-08 status selain REQUESTED ditolak",
  async () => {
    const ref = orderRef(
      ownerDb(),
      "order-invalid-status"
    );

    await assertFails(
      setDoc(
        ref,
        validOrder({
          status: "COMPLETED"
        })
      )
    );
  }
);

test(
  "TC-RULE-09 field tambahan dari client ditolak",
  async () => {
    const ref = orderRef(
      ownerDb(),
      "order-extra-field"
    );

    await assertFails(
      setDoc(
        ref,
        validOrder({
          assignedOperatorRef:
            "manpower/fake-operator"
        })
      )
    );
  }
);

test(
  "TC-RULE-10 field wajib yang hilang ditolak",
  async () => {
    const payload = validOrder();
    delete payload.serviceZone;

    const ref = orderRef(
      ownerDb(),
      "order-missing-field"
    );

    await assertFails(
      setDoc(ref, payload)
    );
  }
);

test(
  "TC-RULE-11 alamat pickup terlalu pendek ditolak",
  async () => {
    const ref = orderRef(
      ownerDb(),
      "order-short-address"
    );

    await assertFails(
      setDoc(
        ref,
        validOrder({
          pickup: {
            address: "A",
            requestedAt: Timestamp.fromDate(
              new Date("2030-01-01T08:00:00Z")
            )
          }
        })
      )
    );
  }
);

test(
  "TC-RULE-12 owner dapat membaca order sendiri",
  async () => {
    const ref = orderRef(
      ownerDb(),
      "order-owner-read"
    );

    await assertSucceeds(
      setDoc(ref, validOrder())
    );

    const snapshot = await assertSucceeds(
      getDoc(ref)
    );

    assert.equal(snapshot.exists(), true);
    assert.equal(
      snapshot.data().ownerUid,
      OWNER_UID
    );
  }
);

test(
  "TC-RULE-13 user lain tidak dapat membaca order",
  async () => {
    const ownerRef = orderRef(
      ownerDb(),
      "order-private"
    );

    await assertSucceeds(
      setDoc(ownerRef, validOrder())
    );

    const foreignRef = orderRef(
      otherDb(),
      "order-private"
    );

    await assertFails(
      getDoc(foreignRef)
    );
  }
);

test(
  "TC-RULE-14 admin dapat membaca order",
  async () => {
    const ownerRef = orderRef(
      ownerDb(),
      "order-admin-read"
    );

    await assertSucceeds(
      setDoc(ownerRef, validOrder())
    );

    const ref = orderRef(
      adminDb(),
      "order-admin-read"
    );

    const snapshot = await assertSucceeds(
      getDoc(ref)
    );

    assert.equal(snapshot.exists(), true);
  }
);

test(
  "TC-RULE-15 customer tidak dapat update order",
  async () => {
    const ref = orderRef(
      ownerDb(),
      "order-update-denied"
    );

    await assertSucceeds(
      setDoc(ref, validOrder())
    );

    await assertFails(
      updateDoc(ref, {
        customerNotes: "Catatan baru",
        updatedAt: serverTimestamp()
      })
    );
  }
);

test(
  "TC-RULE-16 customer tidak dapat delete order",
  async () => {
    const ref = orderRef(
      ownerDb(),
      "order-delete-denied"
    );

    await assertSucceeds(
      setDoc(ref, validOrder())
    );

    await assertFails(
      deleteDoc(ref)
    );
  }
);
