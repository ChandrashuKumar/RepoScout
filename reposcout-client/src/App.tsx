import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./pages/RootLayout";
import IntroPage from "./pages/IntroPage";
import AuthOptionsPage from "./pages/AuthOptionsPage";
import EmailAuthPage from "./pages/EmailAuthPage";
import DashboardPage from "./pages/DashboardPage";
import RepoPage from "./pages/RepoPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import { ServerAlertBanner } from "@/components/ServerAlertBanner";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <IntroPage />,
      },
      {
        path: "/auth",
        element: <AuthOptionsPage />,
      },
      {
        path: "/auth/email",
        element: <EmailAuthPage />,
      },
      {
        path: "/auth/callback",
        element: <AuthCallbackPage />,
      },
      {
        path: "/dashboard",
        element: <DashboardPage />,
      },
      {
        path: "/repo/:repoId",
        element: <RepoPage />,
      },
    ],
  },
]);

function App() {
  return (
    <>
      <ServerAlertBanner />
      <RouterProvider router={router} />
    </>
  );
}

export default App;