import { api } from "@/lib/api";
import { RegisterAgentForm } from "@/components/RegisterAgentForm";

interface AgentEntry {
  owner: string;
  metadataUri: string;
  capabilities: string;
  active: boolean;
}

interface AgentsResponse {
  agents: AgentEntry[];
  total: number;
}

export default async function AgentsPage() {
  let data: AgentsResponse = { agents: [], total: 0 };
  try {
    data = await api.get<AgentsResponse>("/agents");
  } catch { /* API not running */ }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      <div>
        <h2 style={{ marginBottom: "1.5rem" }}>Agent Explorer</h2>
        {data.agents.length === 0 ? (
          <p style={{ color: "#888" }}>No agents registered yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Address</th>
                <th>Capabilities</th>
                <th>Metadata</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.agents.map((a) => (
                <tr key={a.owner}>
                  <td style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                    {a.owner.slice(0, 8)}…{a.owner.slice(-6)}
                  </td>
                  <td>{a.capabilities}</td>
                  <td>
                    <a href={a.metadataUri} target="_blank" rel="noreferrer">
                      {a.metadataUri.slice(0, 30)}…
                    </a>
                  </td>
                  <td style={{ color: a.active ? "#4ade80" : "#f87171" }}>
                    {a.active ? "Active" : "Inactive"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <hr style={{ borderColor: "#1e1e2e" }} />
      <RegisterAgentForm />
    </div>
  );
}
