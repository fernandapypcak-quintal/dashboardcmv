import { useState } from 'react';
import { CMVProvider } from './hooks/useCMV';
import Sidebar   from './components/layout/Sidebar';
import Header    from './components/layout/Header';
import LoadingScreen from './components/ui/LoadingScreen';
import Home          from './components/pages/Home';
import CMVCategorias from './components/pages/CMVCategorias';
import Desperdicio   from './components/pages/Desperdicio';
import Produtos      from './components/pages/Produtos';
import TeoricoReal   from './components/pages/TeoricoReal';
import { useCMV }    from './hooks/useCMV';

const PAGES = { home: Home, cmv: CMVCategorias, desperdicio: Desperdicio, produtos: Produtos, teorico: TeoricoReal };

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
          {loading  ? <LoadingScreen /> :
           error    ? <ErrorScreen msg={error} /> :
           <Page />}
        </main>
      </div>
    </div>
  );
}

function ErrorScreen({ msg }) {
  return (
    <div className="flex-1 flex items-center justify-center p-12 text-center">
      <div>
        <p className="text-4xl mb-4">⚠️</p>
        <p className="font-semibold text-brand-black mb-2">Erro ao carregar dados</p>
        <p className="text-sm text-zinc-400 max-w-md">{msg}</p>
        <p className="text-xs text-zinc-300 mt-3">
          Verifique se a URL do Apps Script está configurada em <code className="font-mono">src/data/loader.js</code>
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return <CMVProvider><Inner /></CMVProvider>;
}
