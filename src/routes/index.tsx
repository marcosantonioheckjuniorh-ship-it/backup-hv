import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  if (typeof window !== "undefined") {
    window.location.replace("/funil/1/index.html" + window.location.search);
  }
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui", color: "#002279" }}>
      Carregando…
    </div>
  );
}
