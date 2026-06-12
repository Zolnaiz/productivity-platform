import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">
          Productivity + Operations Platform
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
          Төсөл, ажилтан, цаг бүртгэл, 5S audit, тайланг нэг дор удирдана.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-gray-300">
          Байгууллагын өдөр тутмын ажил, сарын тайлан, салбарын checklist,
          productivity analytics-ийг нэгтгэсэн web болон mobile платформ.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            to="/login"
            className="rounded-lg bg-blue-500 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-400"
          >
            Нэвтрэх
          </Link>
          <Link
            to="/dashboard"
            className="rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Dashboard харах
          </Link>
        </div>
      </section>
    </main>
  );
};

export default LandingPage;
