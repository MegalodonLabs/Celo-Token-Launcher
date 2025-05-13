import {
  getDefaultWallets,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiConfig, createConfig, configureChains } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { celoAlfajores } from "wagmi/chains";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "@rainbow-me/rainbowkit/styles.css";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TokenForm from './components/TokenForm';
import TokenDashboard from './components/TokenDashboard';

const projectId = "f3cc55aaa4a646c4156007394c2c7f1f";

const { chains, publicClient } = configureChains(
  [celoAlfajores],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: "Token Launcher",
  projectId,
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

function App() {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider
        chains={chains}
        theme={darkTheme()}
        modalSize="compact"
      >
        <ToastContainer 
          position="top-center"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
          limit={3}
        />
        <Router>
          <div className="App p-4 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Token Launcher</h1>
            <Routes>
              <Route path="/" element={<TokenForm />} />
              <Route path="/token/:address" element={<TokenDashboard />} />
            </Routes>
          </div>
        </Router>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

export default App; 