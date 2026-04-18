type RequestStatus = "PENDING" | "ACCEPTED" | "REJECTED";

const labels: Record<RequestStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

export function StatusBadge({ status }: { status: string }) {
  const normalized = (status in labels ? status : "PENDING") as RequestStatus;

  return (
    <span className={`status-badge ${normalized.toLowerCase()}`}>{labels[normalized]}</span>
  );
}
