import Head from "next/head";
import Dashboard from "../components/Dashboard";

export default function Home() {
  return (
    <div>
      <Head>
        <title>Big Brother - VPS Monitoring Dashboard</title>
        <meta
          name="description"
          content="Monitor your PM2 applications on VPS"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <Dashboard />
      </main>
    </div>
  );
}
