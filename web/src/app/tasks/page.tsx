import { api } from "@/lib/api";
import { PostTaskForm } from "@/components/PostTaskForm";

interface Task {
  id: string;
  requester: string;
  descriptionUri: string;
  paymentAmount: string;
  status: string;
}

interface TasksResponse {
  tasks: Task[];
  total: number;
  status: string;
}

export default async function TasksPage() {
  let data: TasksResponse = { tasks: [], total: 0, status: "Open" };
  try {
    data = await api.get<TasksResponse>("/tasks?status=Open");
  } catch { /* API not running */ }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      <div>
        <h2 style={{ marginBottom: "1.5rem" }}>Task Board</h2>
        {data.tasks.length === 0 ? (
          <p style={{ color: "#888" }}>No open tasks right now.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Requester</th>
              </tr>
            </thead>
            <tbody>
              {data.tasks.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>
                    <a href={t.descriptionUri} target="_blank" rel="noreferrer">
                      {t.descriptionUri.slice(0, 40)}…
                    </a>
                  </td>
                  <td>{t.paymentAmount}</td>
                  <td>{t.status}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                    {t.requester.slice(0, 6)}…{t.requester.slice(-4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <hr style={{ borderColor: "#1e1e2e" }} />
      <PostTaskForm />
    </div>
  );
}
