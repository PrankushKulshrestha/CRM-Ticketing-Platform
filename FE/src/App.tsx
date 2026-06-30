
// src/App.tsx

import type { ReactElement } from "react";

import AppInitializer from "@/app/providers/AppInitializer";
import { AuthProvider } from "@/app/providers/AuthProvider";
import { ErrorBoundaryProvider } from "@/app/providers/ErrorBoundaryProvider";
import { PermissionProvider } from "@/app/providers/PermissionProvider";
import { QueryProvider } from "@/app/providers/QueryProvider";
import { SocketProvider } from "@/app/providers/SocketProvider";
import ThemeProvider from "@/app/providers/ThemeProvider";
import AppRoutes from "@/app/routes/AppRoutes";

/*
|--------------------------------------------------------------------------
| Root Application
|--------------------------------------------------------------------------
|
| Provider Order
|
| ErrorBoundary
|   └── ThemeProvider
|       └── QueryProvider
|           └── AuthProvider
|               └── PermissionProvider
|                   └── SocketProvider
|                       └── AppInitializer
|                           └── AppRoutes
|
|--------------------------------------------------------------------------
*/

export default function App(): ReactElement {
  return (
    <ErrorBoundaryProvider>
      <ThemeProvider>
        <QueryProvider>
          <AuthProvider>
            <PermissionProvider>
              <SocketProvider>
                <AppInitializer>
                  <AppRoutes />
                </AppInitializer>
              </SocketProvider>
            </PermissionProvider>
          </AuthProvider>
        </QueryProvider>
      </ThemeProvider>
    </ErrorBoundaryProvider>
  );
}