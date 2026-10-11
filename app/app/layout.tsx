import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Control Room · Resolve",
  robots: { index: false, follow: false },
};

export default function ControlRoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
