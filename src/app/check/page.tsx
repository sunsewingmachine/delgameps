import React, { Suspense } from "react";
import CheckClient from "./CheckClient";

/*
Purpose:
Server page that renders the client-only CheckClient inside a Suspense
boundary. This provides a fallback during the CSR bailout so useSearchParams
in the client component is allowed during prerender.
*/
export default function CheckPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <CheckClient />
    </Suspense>
  );
}
