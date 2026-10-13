import axios from "axios";
import BASE_URL from "@/app/urlConfig/urlConfig";

const registerService = async (payload: FormData) => {
  const response = await axios.post(
    `${BASE_URL}/api/register`,
    payload
  );

  return response;
};

export default registerService;