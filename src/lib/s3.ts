import AWS from "aws-sdk";
import { resolve } from "path";
import { env } from "process";

export async function uploadToS3(file: File) {
  try {
    AWS.config.update({
      accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY,
    });
    const s3 = new AWS.S3({
      params: {
        Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
      },
      region: "ap-southeast-1",
    });
    const file_key =
      "/uploads" + Date.now().toString() + file.name.replace(" ", "-");

    const params = {
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
      Key: file_key,
      Body: file,
    };
    const upload = s3
      .putObject(params)
      .on("httpUploadProgress", (evt) => {
        console.log(
          "uploading to s3...",
          parseInt(((evt.loaded * 100) / evt.total).toString())
        ) + "%";
      })
      .promise();

    await upload.then((data) => {
      console.log("successfully uploaded to S3!", file_key);
    });
    return Promise.resolve({
      file_key,
      file_name: file.name,
    });

    // const upload = s3
    //   .putObject(params)
    //   .on("htttpUploadProgress", (evt) => {
    //     console.log(
    //       "uploading to s3...",
    //       parseInt((evt.loaded * 100) / evt.total).toString()
    //     ) + "%";
    //   })
    //   .promise();

    // upload.then((data) => {
    //   console.log("Successfully uploaded on S3!", file_key);
    // });
  } catch (error) {}
}

export function getS3Url(file_key: string) {
  const url = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.ap-southeast-1.amazonaws.com/${file_key}`;
  return url;
}
