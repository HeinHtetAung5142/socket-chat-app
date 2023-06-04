import {S3Lib} from "s3-simplified";

const s3 = new S3Lib({
    accessKey: {
        id: "Aungmongus",
        secret: "Aungmongus",
    },
    region: "ap-southeast-1"
});

export default s3;
