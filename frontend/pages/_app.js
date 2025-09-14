import "../styles/globals.css";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "../store";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { initializeAuth } from "../store/authSlice";

// Component to initialize auth
function AuthInitializer() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  return null;
}

export default function App({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AuthInitializer />
        <Component {...pageProps} />
      </PersistGate>
    </Provider>
  );
}
