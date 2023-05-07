/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, useRef } from "react";
import EVENTS from "../config/events";
import { useSockets } from "../context/socket.context";
import styles from "../styles/Messages.module.css";

function MessagesContainer() {
  const { socket, messages, roomId, username, setMessages } = useSockets();
  const newMessageRef = useRef(null);
  const messageEndRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  function handleSendPrivateMessage() {
    const message = newMessageRef.current.value;

    if (!String(message).trim() && selectedFiles.length === 0) {
      return;
    }

    socket.emit(EVENTS.CLIENT.SEND_PRIVATE_MESSAGE, {
      message,
      to: roomId,
      files: selectedFiles,
    });

    const date = new Date();

    setMessages([
      ...messages,
      {
        username: "You",
        message,
        time: `${date.getHours()}:${date.getMinutes()}`,
        files: selectedFiles,
      },
    ]);

    newMessageRef.current.value = "";
    setSelectedFiles([]);
  }

  function handleSendMessage() {
    const message = newMessageRef.current.value;

    if (!String(message).trim() && selectedFiles.length === 0) {
      return;
    }

    socket.emit(EVENTS.CLIENT.SEND_ROOM_MESSAGE, {
      roomId,
      message,
      username,
      files: selectedFiles,
    });

    const date = new Date();

    setMessages([
      ...messages,
      {
        username: "You",
        message,
        time: `${date.getHours()}:${date.getMinutes()}`,
        files: selectedFiles,
      },
    ]);

    newMessageRef.current.value = "";
    setSelectedFiles([]);
  }

  function handleFileInputChange(event) {
    const files = event.target.files;
    const fileArray = [];

    for (let i = 0; i < files.length; i++) {
      const file = files.item(i);
      const reader = new FileReader();

      reader.onload = (event) => {
        fileArray.push({
          name: file.name,
          size: file.size,
          type: file.type,
          data: event.target.result,
        });

        if (fileArray.length === files.length) {
          setSelectedFiles(fileArray);
        }
      };

      reader.readAsDataURL(file);
    }
  }

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!roomId) {
    return <div />;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.messageList}>
        {messages.map(({ message, username, time, files }, index) => {
          return (
            <div key={index} className={styles.message}>
              <div key={index} className={styles.messageInner}>
                <span className={styles.messageSender}>
                  {username} - {time}
                </span>
                <span className={styles.messageBody}>{message}</span>
                {files &&
                  files.map((file, index) => (
                    <div key={index}>
                      {file.type.includes("image/") ? (
                        <img
                          src={file.data}
                          alt={file.name}
                          style={{ width: "120px", height: "120px" }}
                        />
                      ) : (
                        <a
                          href={file.data}
                          target={file.data}
                          download
                          rel="noopener noreferrer"
                        >
                          {file.name}
                        </a>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
        <div ref={messageEndRef} />
      </div>
      <div className={styles.messageBox}>
        <input
          type="file"
          id="upload"
          multiple
          hidden
          onChange={handleFileInputChange}
        />
        <label htmlFor="upload" className={styles.upload}>
          UPLOAD
        </label>
        <textarea
          rows={1}
          placeholder="Tell us what you are thinking"
          ref={newMessageRef}
        />
        <button onClick={handleSendMessage}>SEND</button>
      </div>
    </div>
  );
}

export default MessagesContainer;
