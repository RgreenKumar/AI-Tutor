import { createContext, useState } from "react";

export const UserContext = createContext();

export function UserProvider({ children }) {

  const [user, setUser] = useState(null);

  function loginUser(userData) {
    setUser(userData);
  }

  function logoutUser() {
    setUser(null);
  }

  return (
    <UserContext.Provider
      value={{
        user,
        loginUser,
        logoutUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}