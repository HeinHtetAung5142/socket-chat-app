import io from "socket.io-client";
import { useState, useEffect, useRef } from "react";

let socket;

type Message = {
  author: string;
  message?: string;
  file?: {
    data: ArrayBuffer;
    name: string;
  };
};

const PreviewFile = ({
  file,
  fileName,
}: {
  file: ArrayBuffer;
  fileName: string;
}) => {
  const [src, setSrc] = useState("");

  useEffect(() => {
    const blob = new Blob([file]);
    const objectUrl = URL.createObjectURL(blob);
    setSrc(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  return (
    <div>
      {file && <img src={src} style={{ width: "120px", height: "120px" }} />}
      {file && (
        <div className="flex justify-between items-center">
          <a
            href={src}
            download={fileName}
            className="block text-center"
            style={{ width: "120px" }}
          >
            Download file
          </a>
          <div className="flex-1 text-right">{fileName}</div>
        </div>
      )}
    </div>
  );
};

export default function Home() {
  const [username, setUsername] = useState("");
  const [chosenUsername, setChosenUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<Message>>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Track selected file
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref to file input element

  useEffect(() => {
    socketInitializer();
  }, []);

  const socketInitializer = async () => {
    // We just call it because we don't need anything else out of it
    await fetch("/api/socket");

    socket = io();

    socket.on("newIncomingMessage", (msg) => {
      setMessages((currentMsg) => [
        ...currentMsg,
        { author: msg.author, message: msg.message, file: msg.file },
      ]);
      console.log(messages);
    });
  };

  const sendMessage = async () => {
    if (message || selectedFile) {
      let fileData: ArrayBuffer | undefined;
      let fileName: string | undefined;
      if (selectedFile) {
        const reader = new FileReader();
        reader.readAsArrayBuffer(selectedFile);
        fileName = selectedFile.name;
        fileData = await new Promise((resolve) => {
          reader.onload = () => {
            resolve(reader.result as ArrayBuffer);
          };
        });
      }
      socket.emit("createdMessage", {
        author: chosenUsername,
        message,
        file: {
          data: fileData,
          name: fileName,
        },
      });
      setMessages((currentMsg) => [
        ...currentMsg,
        {
          author: chosenUsername,
          message,
          file: { data: fileData, name: fileName },
        },
      ]);
      setMessage("");
      setSelectedFile(null);
    }
  };

  const handleKeypress = (e) => {
    //it triggers by pressing the enter key
    if (e.keyCode === 13) {
      if (message) {
        sendMessage();
      }
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <div className="flex items-center p-4 mx-auto min-h-screen justify-center bg-purple-500">
      <main className="gap-4 flex flex-col items-center justify-center w-full h-full">
        {!chosenUsername ? (
          <>
            <h3 className="font-bold text-white text-xl">
              How people should call you?
            </h3>
            <input
              type="text"
              placeholder="Identity..."
              value={username}
              className="p-3 rounded-md outline-none"
              onChange={(e) => setUsername(e.target.value)}
            />
            <button
              onClick={() => {
                setChosenUsername(username);
              }}
              className="bg-white rounded-md px-4 py-2 text-xl"
            >
              Go!
            </button>
          </>
        ) : (
          <>
            <p className="font-bold text-white text-xl">
              Your username: {username}
            </p>
            <div className="flex flex-col justify-end bg-white h-[20rem] min-w-[33%] rounded-md shadow-md ">
              <div className="h-full last:border-b-0 overflow-y-scroll">
                {messages.map((msg, i) => {
                  return (
                    <div
                      className="w-full py-1 px-2 border-b border-gray-200"
                      key={i}
                    >
                      {msg.author} : {msg.message}
                      {msg.file && (
                        <PreviewFile
                          file={msg.file.data}
                          fileName={msg.file.name}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-gray-300 w-full flex rounded-bl-md">
                <div className="border-l border-gray-300 flex justify-center items-center  rounded-br-md group hover:bg-purple-500 transition-all">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                  />
                </div>
                <input
                  type="text"
                  placeholder="New message..."
                  value={message}
                  className="outline-none py-2 px-2 rounded-bl-md flex-1"
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyUp={handleKeypress}
                />
                <div className="border-l border-gray-300 flex justify-center items-center  rounded-br-md group hover:bg-purple-500 transition-all">
                  <button
                    className="group-hover:text-white px-3 h-full"
                    onClick={() => {
                      sendMessage();
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
