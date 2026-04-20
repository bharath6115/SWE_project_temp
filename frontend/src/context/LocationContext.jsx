import { createContext, useCallback, useContext, useMemo, useState } from "react";

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(null);
  const [permission, setPermission] = useState("prompt");

  const requestLocation = useCallback(
    () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) {
        setPermission("unsupported");
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const next = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocation(next);
          setPermission("granted");
          resolve(next);
        },
        () => {
          setPermission("denied");
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }),
    []
  );

  const value = useMemo(
    () => ({ location, permission, requestLocation }),
    [location, permission, requestLocation]
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocationContext must be used within LocationProvider");
  return ctx;
}
