"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MAX_PDF_BYTES } from "@/convex/inspections/validators";
import { Button } from "@/components/Button";
import {
  ErrorNotice,
  InspectionShell,
  InspectionStatus,
  inspectionError,
} from "@/components/InspectionUI";

export default function InspectionsPage() {
  const { isAuthenticated } = useConvexAuth();
  return (
    <InspectionShell>
      <p className="mb-3 text-xs tracking-widest text-muted">
        FROM REPORT TO REVIEW
      </p>
      <h1>Upload an inspection.</h1>
      <p className="mt-4 max-w-2xl leading-7 text-muted">
        Resolve finds possible deficiencies in your report. You decide what
        enters remediation.
      </p>
      {isAuthenticated ? (
        <Upload />
      ) : (
        <p className="mt-8" role="status">
          Connecting to your workspace…
        </p>
      )}
    </InspectionShell>
  );
}
function Upload() {
  const router = useRouter();
  const inspections = useQuery(api.inspections.documents.list);
  const requestUpload = useMutation(api.inspections.uploads.requestUploadUrl);
  const register = useMutation(api.inspections.uploads.register);
  const analyze = useMutation(api.inspections.documents.analyze);
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  function select(candidate?: File) {
    setError(null);
    setFile(null);
    if (!candidate) return;
    if (
      !/\.pdf$/i.test(candidate.name) ||
      (candidate.type && candidate.type !== "application/pdf")
    ) {
      setError("Choose a PDF inspection report.");
      return;
    }
    if (candidate.size > MAX_PDF_BYTES || candidate.size < 5) {
      setError("Choose a nonempty PDF of up to 10 MB.");
      return;
    }
    setFile(candidate);
  }
  async function upload() {
    if (!file || busy.current) return;
    busy.current = true;
    setError(null);
    setState("Checking PDF…");
    try {
      if ((await file.slice(0, 5).text()) !== "%PDF-") {
        setError("This file is not a PDF.");
        return;
      }
      const token = Array.from(
        crypto.getRandomValues(new Uint8Array(32)),
        (b) => b.toString(16).padStart(2, "0"),
      ).join("");
      const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(token),
      );
      const tokenHash = Array.from(new Uint8Array(digest), (b) =>
        b.toString(16).padStart(2, "0"),
      ).join("");
      const { uploadId, url } = await requestUpload({ tokenHash });
      setState("Uploading PDF…");
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/pdf",
          "X-Upload-Id": uploadId,
          "X-Upload-Token": token,
        },
        body: file,
      });
      if (!response.ok) {
        setError("The PDF could not be uploaded. Please try again.");
        return;
      }
      setState("Saving inspection…");
      const inspectionId = await register({ uploadId, filename: file.name });
      setState("Starting analysis…");
      // The saved document is recoverable from the list if this request is interrupted.
      await analyze({ inspectionId });
      router.push(`/app/inspections/${inspectionId}`);
    } catch (error) {
      setError(inspectionError(error));
    } finally {
      setState(null);
      busy.current = false;
    }
  }
  return (
    <>
      <section
        className="my-8 rounded-lg border border-border bg-surface p-5 sm:p-8"
        aria-label="Upload PDF"
      >
        <label
          className="relative flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-line bg-subtle p-6 text-center focus-within:outline-2 focus-within:outline-accent"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            if (!state) select(event.dataTransfer.files[0]);
          }}
        >
          <span aria-hidden="true" className="text-4xl text-accent">
            ↥
          </span>
          <span className="font-medium">
            Choose or drop your inspection PDF
          </span>
          <span className="text-xs text-muted">PDF only · Up to 10 MB</span>
          <input
            className="absolute inset-0 w-full cursor-pointer opacity-0"
            aria-label="Inspection PDF"
            type="file"
            accept=".pdf,application/pdf"
            disabled={!!state}
            onChange={(event) => select(event.target.files?.[0])}
          />
        </label>
        {file && (
          <p className="mt-4 break-all text-sm">
            <strong>{file.name}</strong> · {(file.size / 1024).toFixed(1)} KB
          </p>
        )}
        <ErrorNotice message={error} />
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button disabled={!file || !!state} onClick={() => void upload()}>
            {state ?? "Upload & analyze →"}
          </Button>
          {state && (
            <p role="status" className="text-sm text-muted">
              {state}
            </p>
          )}
        </div>
        <p className="mt-5 text-xs leading-6 text-muted">
          Private to your workspace. The report is sent to OpenAI for analysis.
          Every proposed finding needs your review before it can enter
          remediation.
        </p>
        <a
          className="mt-3 inline-block text-xs underline underline-offset-4"
          href="/samples/resolve-sample-inspection.pdf"
          download
        >
          Download a synthetic sample report
        </a>
      </section>
      <section>
        <h2>Your inspections</h2>
        {inspections === undefined ? (
          <p role="status" className="mt-4 text-muted">
            Loading inspections…
          </p>
        ) : inspections.length === 0 ? (
          <p className="mt-4 text-muted">
            Your uploaded reports will appear here.
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {inspections.map((inspection) => (
              <li key={inspection._id}>
                <Link
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface p-4 hover:border-accent-border"
                  href={`/app/inspections/${inspection._id}`}
                >
                  <span className="min-w-0 break-all font-medium">
                    {inspection.title}
                  </span>
                  <InspectionStatus status={inspection.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
