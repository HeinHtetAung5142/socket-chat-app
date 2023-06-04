import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import { useSockets } from "../context/socket.context";

import RoomsContainer from "../containers/Rooms";
import MessagesContainer from "../containers/Messages";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const { socket, username, setUsername } = useSockets();
  const usernameRef = useRef(null);
  const [selectedUser, setSelectedUser] = useState("");

  function handleSetUsername() {
    const value = usernameRef.current.value;
    if (!value) {
      return;
    }

    socket.auth = { username: value };
    socket.connect();

    setUsername(value);
    localStorage.setItem("username", value);
  }

  useEffect(() => {
    if (usernameRef.current)
      usernameRef.current.value = localStorage.getItem("username") || "";
    console.log(selectedUser);
  }, [selectedUser]);

  return (
    <div>
      {!username && (
        <div className={styles.usernameWrapper}>
          <div className={styles.usernameInner}>
            <input placeholder="Username" ref={usernameRef} />
            <button className="cta" onClick={handleSetUsername}>
              START
            </button>
          </div>
        </div>
      )}
      {username && (
        <div className={styles.container}>
          <RoomsContainer setSelectedUser={setSelectedUser} />
          <MessagesContainer selectedUser={selectedUser} />
        </div>
      )}
    </div>
  );
}
