import {
  PineconeClient,
  Vector,
  utils as PineconeUtils,
} from "@pinecone-database/pinecone";
import { downloadFromS3 } from "./s3-server";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { error } from "console";
import {
  Document,
  RecursiveCharacterTextSplitter,
} from "@pinecone-database/doc-splitter";
import { getEmbeddings } from "./db/embeddings";
import md5 from "md5";
import { convertToAsci } from "./utils";

let pinecone: PineconeClient | null = null;
export const getPineconeClient = async () => {
  if (!pinecone) {
    pinecone = new PineconeClient();
    await pinecone.init({
      environment: process.env.PINECON_ENVIRONMENT!,
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  return pinecone;
};

type PDFPage = {
  pageContent: string;
  metadata: {
    loc: { pageNumber: number };
  };
};

export async function loadS3IntoPinecone(filekey: string) {
  //1. obatin pdf in file system
  console.log("download S3 into file system");
  const file_name = await downloadFromS3(filekey);
  if (!file_name) {
    throw error("failed download from S3");
  }
  const loader = new PDFLoader(file_name);
  const pages = (await loader.load()) as PDFPage[];
  //2. splitt and segment decuments
  const documents = await Promise.all(pages.map(prepareDocument));

  //3 embeded and vectorise individual documents
  const vectors = await Promise.all(documents.flat().map(emebedeDocuments));

  //4 uploade to PineconeDB

  const client = await getPineconeClient();
  const pinconeIndex = client.Index("chatpdf-dan");
  console.log("Insertin vectors into Pinecone");
  const namespace = convertToAsci(filekey);
  PineconeUtils.chunkedUpsert(pinconeIndex, vectors, namespace, 10);

  return documents[0];
}

export async function emebedeDocuments(doc: Document) {
  try {
    const embedding = await getEmbeddings(doc.pageContent);
    const hash = md5(doc.pageContent);

    return {
      id: hash,
      values: embedding,
      metadata: {
        text: doc.metadata.text,
        pageNumber: doc.metadata.pageNumber,
      },
    } as Vector;
  } catch (error) {
    console.log("error embedding documents", error);
    return error;
  }
}

export const truncateStringByBytes = (str: string, bytes: number) => {
  const enc = new TextEncoder();
  return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
};

async function prepareDocument(page: PDFPage) {
  let { pageContent, metadata } = page;
  pageContent = pageContent.replace(/\n/g, "");
  // split the docs
  const splitter = new RecursiveCharacterTextSplitter();
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        pageNumber: metadata.loc.pageNumber,
        text: truncateStringByBytes(pageContent, 36000),
      },
    }),
  ]);
  return docs;
}
