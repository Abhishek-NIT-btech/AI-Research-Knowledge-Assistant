import { useEffect, useRef, useState } from "react";
import api from "../api/api";
import ReactMarkdown from "react-markdown";

import {
  FaRobot,
  FaUserCircle,
  FaCopy,
  FaTrash,
  FaSyncAlt,
  FaUpload,
  FaPaperPlane,
  FaFilePdf,
} from "react-icons/fa";

interface Document {
  id: number;
  filename: string;
  upload_time: string;
  total_pages: number;
  total_chunks: number;
  status: string;
}

interface Source {
  filename: string;
  page: number;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  sources?: Source[];
}

function Dashboard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const [question, setQuestion] = useState("");

  const [uploading, setUploading] = useState(false);
  const [loadingAnswer, setLoadingAnswer] = useState(false);

  const [message, setMessage] = useState("");

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyAnswer = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const fetchDocuments = async () => {
    try {
      const response = await api.get("/documents");
      setDocuments(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [chatMessages]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const formData = new FormData();

    formData.append("file", file);

    try {
      setUploading(true);
      setMessage("");

      const response = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage(response.data.message);

      fetchDocuments();
    } catch (error) {
      console.error(error);

      setMessage("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (documentId: number) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this document?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/documents/${documentId}`);

      setMessage("Document deleted successfully.");

      fetchDocuments();
    } catch (error) {
      console.error(error);

      setMessage("Failed to delete document.");
    }
  };

  const reprocessDocument = async (documentId: number) => {
    try {
      setMessage("Reprocessing document...");

      await api.post(`/documents/${documentId}/reprocess`);

      setMessage("Document reprocessed successfully.");

      fetchDocuments();
    } catch (error) {
      console.error(error);

      setMessage("Failed to reprocess document.");
    }
  };
    const askQuestion = async () => {
    if (!question.trim()) return;

    const userQuestion = question;

    setChatMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: userQuestion,
        timestamp: getCurrentTime(),
      },
    ]);

    setQuestion("");

    try {
      setLoadingAnswer(true);

      const response = await api.get("/ask", {
        params: {
          question: userQuestion,
        },
      });

      const sources: Source[] =
        response.data.context?.map((item: any) => ({
          filename: item.filename,
          page: item.page,
        })) || [];

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: response.data.answer,
          timestamp: getCurrentTime(),
          sources,
        },
      ]);
    } catch (error) {
      console.error(error);

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "❌ Unable to generate an answer.",
          timestamp: getCurrentTime(),
        },
      ]);
    } finally {
      setLoadingAnswer(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">

      {/* Header */}

      <header className="bg-blue-700 text-white shadow-lg">

        <div className="max-w-7xl mx-auto px-8 py-5">

          <h1 className="text-3xl font-bold">
            AI Research & Knowledge Assistant
          </h1>

          <p className="text-blue-100 mt-2">
            Upload PDFs, search documents and chat with your AI assistant.
          </p>

        </div>

      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6 p-6">

        {/* Sidebar */}

        <aside className="col-span-3 bg-white rounded-2xl shadow-lg p-5">

          <h2 className="text-xl font-bold mb-5">
            📚 Documents
          </h2>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            hidden
            onChange={handleFileChange}
          />

          <button
            onClick={handleUploadClick}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 flex justify-center items-center gap-2 transition"
          >
            <FaUpload />

            {uploading ? "Uploading..." : "Upload PDF"}
          </button>

          {message && (

            <div className="mt-4 bg-green-100 text-green-700 rounded-xl p-3 text-sm">

              {message}

            </div>

          )}

          <div className="mt-6 space-y-4">

  {documents.length === 0 ? (

              <div className="text-center py-10">

                <FaFilePdf
                  size={45}
                  className="mx-auto text-gray-300"
                />

                <p className="text-gray-500 mt-3">
                  No documents uploaded yet.
                </p>

              </div>

            ) : (

              documents.map((doc) => (

                <div
                  key={doc.id}
                  className="bg-slate-50 border rounded-2xl p-4 hover:shadow-md transition"
                >

                  <div className="flex items-start gap-3">

                    <FaFilePdf
                      className="text-red-500 mt-1"
                      size={22}
                    />

                    <div className="flex-1">

                      <h3 className="font-semibold text-gray-800 break-all">

                        {doc.filename}

                      </h3>

                      <div className="text-sm text-gray-500 mt-2 space-y-1">

                        <p>
                          📄 {doc.total_pages} Pages
                        </p>

                        <p>
                          🧩 {doc.total_chunks} Chunks
                        </p>

                        <p>

                          Status :

                          <span
                            className={`ml-2 font-semibold ${
                              doc.status === "PROCESSED"
                                ? "text-green-600"
                                : "text-orange-500"
                            }`}
                          >

                            {doc.status}

                          </span>

                        </p>

                      </div>

                    </div>

                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-5">

                    <button
                      onClick={() => reprocessDocument(doc.id)}
                      className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-xl transition"
                    >

                      <FaSyncAlt />

                      Reprocess

                    </button>

                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl transition"
                    >

                      <FaTrash />

                      Delete

                    </button>

                  </div>

                </div>

              ))

            )}

          </div>

        </aside>

        {/* ================= CHAT SECTION ================= */}

        <main className="col-span-9 bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden">

          <div className="border-b px-6 py-5">

            <h2 className="text-2xl font-bold text-gray-800">

              AI Chat

            </h2>

            <p className="text-gray-500 mt-1">

              Ask questions about your uploaded PDFs.

            </p>

          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-6 space-y-6">

            {chatMessages.length === 0 ? (

              <div className="h-full flex flex-col items-center justify-center text-center">

                <FaRobot
                  size={80}
                  className="text-blue-500 mb-6"
                />

                <h2 className="text-2xl font-bold">

                  Welcome 👋

                </h2>

                <p className="text-gray-500 mt-3 max-w-md">

                  Upload one or more PDFs and ask anything.
                  The AI will answer using your documents.

                </p>

              </div>

            ) : (

              chatMessages.map((msg, index) => (

                <div
                  key={index}
                  className={`flex ${
                    msg.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >                  <div
                    className={`max-w-3xl flex gap-4 ${
                      msg.role === "user"
                        ? "flex-row-reverse"
                        : ""
                    }`}
                  >

                    {/* Avatar */}

                    <div className="flex-shrink-0">

                      {msg.role === "assistant" ? (

                        <div className="bg-blue-600 text-white rounded-full w-11 h-11 flex items-center justify-center">

                          <FaRobot size={18} />

                        </div>

                      ) : (

                        <div className="bg-gray-700 text-white rounded-full w-11 h-11 flex items-center justify-center">

                          <FaUserCircle size={18} />

                        </div>

                      )}

                    </div>

                    {/* Message Bubble */}

                    <div
                      className={`rounded-2xl shadow px-5 py-4 ${
                        msg.role === "assistant"
                          ? "bg-white border"
                          : "bg-blue-600 text-white"
                      }`}
                    >

                      <div
                        className={`text-xs mb-2 ${
                          msg.role === "assistant"
                            ? "text-gray-400"
                            : "text-blue-100"
                        }`}
                      >
                        {msg.timestamp}
                      </div>

                      {msg.role === "assistant" ? (

                        <div className="prose max-w-none">

                          <ReactMarkdown>

                            {msg.text}

                          </ReactMarkdown>

                        </div>

                      ) : (

                        <div className="whitespace-pre-wrap">

                          {msg.text}

                        </div>

                      )}

                      {msg.role === "assistant" && (

                        <button
                          onClick={() => copyAnswer(msg.text)}
                          className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                        >

                          <FaCopy />

                          Copy Answer

                        </button>

                      )}

                      {msg.role === "assistant" &&
                        msg.sources &&
                        msg.sources.length > 0 && (

                          <div className="mt-6 border-t pt-4">

                            <h4 className="font-semibold text-gray-700 mb-3">

                              📚 Sources

                            </h4>

                            <div className="space-y-2">

                              {msg.sources.map((source, i) => (

                                <div
                                  key={i}
                                  className="bg-slate-100 rounded-xl px-4 py-3 text-sm"
                                >

                                  <div className="font-medium">

                                    📄 {source.filename}

                                  </div>

                                  <div className="text-gray-500">

                                    Page {source.page}

                                  </div>

                                </div>

                              ))}

                            </div>

                          </div>

                        )}

                    </div>

                  </div>

                </div>

              ))

            )}

            {loadingAnswer && (

              <div className="flex items-center gap-3 text-gray-500">

                <FaRobot
                  className="animate-pulse text-blue-600"
                  size={20}
                />

                <span>

                  AI is thinking...

                </span>

              </div>

            )}

            <div ref={chatEndRef} />

          </div>
                    <div className="border-t bg-white p-5">

            <div className="flex gap-3">

              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask anything about your documents..."
                className="flex-1 rounded-xl border border-gray-300 px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loadingAnswer) {
                    askQuestion();
                  }
                }}
              />

              <button
                onClick={askQuestion}
                disabled={loadingAnswer}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl px-6 flex items-center gap-2 transition"
              >
                <FaPaperPlane />

                {loadingAnswer ? "Thinking..." : "Send"}
              </button>

            </div>

          </div>

        </main>

      </div>

    </div>
  );
}

export default Dashboard;