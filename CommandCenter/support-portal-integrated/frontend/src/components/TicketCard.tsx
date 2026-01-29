export default function TicketCard({ ticket }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow">
      <h3>Ticket #{ticket._id}</h3>
      <p>AI Confidence: {ticket.confidence}</p>
      <p>SLA: {ticket.breached ? 'BREACHED' : 'OK'}</p>
    </div>
  );
}
