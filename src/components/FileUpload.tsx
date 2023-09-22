"use client";
import { uploadToS3 } from "@/lib/s3";
import { useMutation } from "@tanstack/react-query";
import { Inbox, Loader2 } from "lucide-react";
import React from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import toast from "react-hot-toast";

const FileUpload = ({
  file_key,
  file_name,
}: {
  file_key: string;
  file_name: string;
}) => {
  const [ uploading, setUploading ] = React.useState(false);
  const { mutate, isLoading } = useMutation({
    mutationFn: async () => {
      const response = await axios.post("/api/create-chat", {
        file_key,
        file_name,
      });
      return response.data;
    },
  });

  const { getInputProps, getRootProps } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      console.log(acceptedFiles);
      const file = acceptedFiles[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Please upload a smaller file");
        //alert("Please upload a smaller file");
        return;
      }
      try {
        setUploading(true);
        const data = await uploadToS3(file);
        if (!data?.file_key || !data.file_name) {
          toast.error("Something went wrong");
          // alert("Something went wrong");
          return;
        }
        mutate(data, {
          onSuccess: (data) => {
            console.log(data);
           // toast.success(data.message);
          },
          onError: (data) => {
            toast.error("Error creating chats");
            //console.log(data);
          },
        });
        //console.log("data: ", data);
      } catch (error) {
        console.log(error);
      } finally {
        setUploading(false);
      }
    },
  });
  return (
    <div className="p-2 rounded-xl bg-orange-100">
      <div
        {...getRootProps({
          className:
            "border-2 border-dashed rounded-xl cursor-pointer bg-gray-50 flex py-8 justify-center items-center flex-col",
        })}
      >
        {/* <input {...getInputProps()} />
        <>
          <Inbox className="w-10 h-10 text-blue-500" />
          <p className="mt-2 text-sm bg-slate-400">Drop PDF here</p>
        </> */}
        <input {...getInputProps()} />
        {uploading || isLoading ? (
          <>
            {/* loading state */}
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            <p className="mt-2 text-sm text-slate-400">
              Spilling Tea to GPT...
            </p>
          </>
        ) : (
          <>
            <Inbox className="w-10 h-10 text-blue-500" />
            <p className="mt-2 text-sm text-slate-400">Drop PDF Here</p>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
