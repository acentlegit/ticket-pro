import Layout from '../components/Layout';
import TicketCard from '../components/TicketCard';

export default function Agent() {
  return (
    <Layout>
      <h1>Agent Dashboard</h1>
      <TicketCard ticket={{_id:123, confidence:0.82, breached:false}} />
    </Layout>
  );
}
