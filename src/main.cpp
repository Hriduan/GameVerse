#include <algorithm>
#include <atomic>
#include <csignal>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <map>
#include <sstream>
#include <string>
#include <thread>

#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
using Socket = SOCKET;
#else
#include <arpa/inet.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <unistd.h>
using Socket = int;
#define INVALID_SOCKET -1
#define SOCKET_ERROR -1
#endif

namespace fs = std::filesystem;
std::atomic<bool> running{true};

void closeSocket(Socket socket) {
#ifdef _WIN32
  closesocket(socket);
#else
  close(socket);
#endif
}

std::string mimeType(const fs::path& path) {
  static const std::map<std::string, std::string> types{
      {".html", "text/html; charset=utf-8"}, {".css", "text/css; charset=utf-8"},
      {".js", "text/javascript; charset=utf-8"}, {".json", "application/json"},
      {".jpg", "image/jpeg"}, {".jpeg", "image/jpeg"}, {".png", "image/png"},
      {".svg", "image/svg+xml"}, {".ico", "image/x-icon"}};
  auto item = types.find(path.extension().string());
  return item == types.end() ? "application/octet-stream" : item->second;
}

std::string response(int status, const std::string& type, const std::string& body) {
  std::string label = status == 200 ? "OK" : status == 201 ? "Created" : status == 404 ? "Not Found" : "Bad Request";
  std::ostringstream out;
  out << "HTTP/1.1 " << status << ' ' << label << "\r\n"
      << "Content-Type: " << type << "\r\n"
      << "Content-Length: " << body.size() << "\r\n"
      << "Cache-Control: no-cache\r\n"
      << "X-Content-Type-Options: nosniff\r\n"
      << "Connection: close\r\n\r\n" << body;
  return out.str();
}

void sendAll(Socket client, const std::string& data) {
  size_t sent = 0;
  while (sent < data.size()) {
    int chunk = send(client, data.data() + sent, static_cast<int>(data.size() - sent), 0);
    if (chunk <= 0) break;
    sent += static_cast<size_t>(chunk);
  }
}

std::string readFile(const fs::path& path) {
  std::ifstream file(path, std::ios::binary);
  return {std::istreambuf_iterator<char>(file), std::istreambuf_iterator<char>()};
}

void handleClient(Socket client, fs::path publicRoot, fs::path dataRoot) {
  std::string request(65536, '\0');
  int size = recv(client, request.data(), static_cast<int>(request.size()), 0);
  if (size <= 0) { closeSocket(client); return; }
  request.resize(static_cast<size_t>(size));

  std::istringstream firstLine(request.substr(0, request.find("\r\n")));
  std::string method, target, version;
  firstLine >> method >> target >> version;
  target = target.substr(0, target.find('?'));

  if (target == "/api/health") {
    sendAll(client, response(200, "application/json", R"({"ok":true,"service":"GameVerse"})"));
  } else if (target == "/api/score" && method == "POST") {
    auto split = request.find("\r\n\r\n");
    std::string body = split == std::string::npos ? "{}" : request.substr(split + 4);
    if (body.size() > 4096) {
      sendAll(client, response(400, "application/json", R"({"ok":false})"));
    } else {
      std::ofstream log(dataRoot / "scores.jsonl", std::ios::app);
      log << body << '\n';
      sendAll(client, response(201, "application/json", R"({"ok":true})"));
    }
  } else {
    if (target == "/") target = "/index.html";
    if (target.find("..") != std::string::npos) {
      sendAll(client, response(400, "text/plain", "Invalid path"));
    } else {
      fs::path file = publicRoot / target.substr(1);
      if (fs::is_regular_file(file)) sendAll(client, response(200, mimeType(file), readFile(file)));
      else sendAll(client, response(404, "text/html; charset=utf-8",
        "<h1>404</h1><p>That route left the arena.</p><a href='/'>Return home</a>"));
    }
  }
  closeSocket(client);
}

int main(int argc, char** argv) {
  int port = argc > 1 ? std::stoi(argv[1]) : 8080;
  fs::path root = fs::current_path();
  fs::path publicRoot = root / "public";
  fs::path dataRoot = root / "data";
  if (!fs::exists(publicRoot)) {
    std::cerr << "Run GameVerse from the project root.\n";
    return 1;
  }
#ifdef _WIN32
  WSADATA data;
  WSAStartup(MAKEWORD(2, 2), &data);
#endif
  Socket server = socket(AF_INET, SOCK_STREAM, 0);
  int reuse = 1;
  setsockopt(server, SOL_SOCKET, SO_REUSEADDR, reinterpret_cast<const char*>(&reuse), sizeof(reuse));
  sockaddr_in address{};
  address.sin_family = AF_INET;
  address.sin_addr.s_addr = INADDR_ANY;
  address.sin_port = htons(static_cast<unsigned short>(port));
  if (bind(server, reinterpret_cast<sockaddr*>(&address), sizeof(address)) == SOCKET_ERROR ||
      listen(server, 32) == SOCKET_ERROR) {
    std::cerr << "Could not start server on port " << port << ".\n";
    return 1;
  }
  std::signal(SIGINT, [](int) { running = false; });
  std::cout << "GameVerse is live at http://localhost:" << port << "\n";
  while (running) {
    Socket client = accept(server, nullptr, nullptr);
    if (client != INVALID_SOCKET)
      std::thread(handleClient, client, publicRoot, dataRoot).detach();
  }
  closeSocket(server);
#ifdef _WIN32
  WSACleanup();
#endif
  return 0;
}
