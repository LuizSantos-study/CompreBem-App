import { NativeModules, Platform } from "react-native";

// Padronização do tipo BigDecimal com o Backend (serializado como number no JSON)
export type BigDecimal = number;

// Estrutura exata do ProdutoResponse retornado pelo Backend
export interface Produto {
  produtoId: number;
  nome: string;
  descricao?: string;
  preco: BigDecimal;
  categoria?: string;
  imagem?: string;
  quantidade: number;
}

// Payload de criação/atualização esperado pelo ProdutoRequest no Backend
export interface ProdutoRequest {
  nome: string;
  descricao?: string;
  preco: BigDecimal;
  categoria?: string;
  imagem?: string;
  quantidade: number;
}

// Estrutura de retorno paginado (Page<ProdutoResponse>) do Spring Boot
export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number; // página atual (0-indexed)
  first: boolean;
  last: boolean;
  empty: boolean;
}

const TIMEOUT_MS = 8000;

// Detecta automaticamente o IP da máquina que está servindo o app na porta 8081 (Web, Celular via Expo Go ou Emulador)
function obterHostApi(): string {
  if (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    window.location?.hostname
  ) {
    return `http://${window.location.hostname}:8080`;
  }

  const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
  if (scriptURL) {
    const match = scriptURL.match(/https?:\/\/([^:/]+)/);
    if (match && match[1]) {
      return `http://${match[1]}:8080`;
    }
  }

  return Platform.OS === "android"
    ? "http://10.0.2.2:8080"
    : "http://localhost:8080";
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || `${obterHostApi()}/api/v1/produtos`;

// Wrapper de fetch com timeout para evitar carregamento infinito no celular
async function fetchComTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const idTimeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error(
        `Tempo limite esgotado (${timeoutMs / 1000}s) ao conectar em ${API_BASE_URL}.`
      );
    }
    throw error;
  } finally {
    clearTimeout(idTimeout);
  }
}

// Formata o valor BigDecimal (number) para exibição em Real (R$)
export function formatarPreco(valor: BigDecimal): string {
  const numero = Number(valor || 0);
  return `R$ ${numero.toFixed(2).replace(".", ",")}`;
}

// Busca produtos paginados (GET /api/v1/produtos?page=X&size=Y&busca=...)
export async function listarProdutosPaginados(
  page: number = 0,
  size: number = 20,
  busca?: string
): Promise<PageResponse<Produto>> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  if (busca && busca.trim() !== "") {
    params.append("busca", busca.trim());
  }

  const response = await fetchComTimeout(`${API_BASE_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Erro ao carregar produtos (HTTP ${response.status})`);
  }

  const data = await response.json();

  // Compatibilidade com o formato Page do Spring Data (raiz ou aninhado em data.page)
  const content: Produto[] = Array.isArray(data.content) ? data.content : [];
  const totalPages: number = data.totalPages ?? data.page?.totalPages ?? 1;
  const totalElements: number =
    data.totalElements ?? data.page?.totalElements ?? content.length;
  const currentNumber: number = data.number ?? data.page?.number ?? page;
  const pageSize: number = data.size ?? data.page?.size ?? size;
  const isLast: boolean =
    typeof data.last === "boolean"
      ? data.last
      : currentNumber + 1 >= totalPages;
  const isFirst: boolean =
    typeof data.first === "boolean" ? data.first : currentNumber === 0;

  return {
    content,
    totalPages,
    totalElements,
    size: pageSize,
    number: currentNumber,
    first: isFirst,
    last: isLast,
    empty: content.length === 0,
  };
}

// Busca detalhes de um único produto por ID (GET /api/v1/produtos/{id})
export async function buscarProdutoPorId(id: number): Promise<Produto> {
  const response = await fetchComTimeout(`${API_BASE_URL}/${id}`);

  if (response.status === 404) {
    const erro404 = new Error("Produto não encontrado (404).");
    (erro404 as any).status = 404;
    throw erro404;
  }

  if (!response.ok) {
    throw new Error(`Erro ao buscar produto (HTTP ${response.status})`);
  }

  return await response.json();
}

// Cadastra um novo produto no backend (POST /api/v1/produtos)
export async function cadastrarProdutoApi(
  novoProduto: ProdutoRequest
): Promise<Produto> {
  const response = await fetchComTimeout(API_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(novoProduto),
  });

  if (!response.ok) {
    throw new Error(`Erro ao cadastrar produto (HTTP ${response.status})`);
  }

  return await response.json();
}
