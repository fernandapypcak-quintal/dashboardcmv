import { useState } from 'react';
import { CMVProvider, useCMV } from './hooks/useCMV';
import Sidebar       from './components/layout/Sidebar';
import Header        from './components/layout/Header';
import Home          from './components/pages/Home';
import Rentabilidade from './components/pages/Rentabilidade';
import Volume        from './components/pages/Volume';
import Desperdicio   from './components/pages/Desperdicio';
import Variacao      from './components/pages/Variacao';

const PAGES = { home: Home, rentabilidade: Rentabilidade, volume: Volume, desperdicio: Desperdicio, variacao: Variacao };

function Inner() {
  const [page, setPage] = useState('home');
  const { loading, error } = useCMV();
  const Page = PAGES[page] ?? Home;

  return (
    <div className="flex h-screen overflow-hidden bg-surface-base">
      <Sidebar activePage={page} onPageChange={setPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header activePage={page} />
        <main className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-brand-olive border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
                <p className="text-sm text-zinc-400">Carregando dados CMV...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full p-12 text-center">
              <div>
                <p className="text-4xl mb-4">⚠️</p>
                <p className="font-semibold text-brand-black mb-2">Erro ao carregar dados</p>
                <p className="text-sm text-zinc-400 max-w-md">{error}</p>
                <p className="text-xs text-zinc-300 mt-3">
                  Verifique se a URL do Apps Script está configurada em <code className="font-mono">src/data/config.js</code>
                </p>
              </div>
            </div>
          ) : (
            <Page onPageChange={setPage} />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return <CMVProvider><Inner /></CMVProvider>;
}
