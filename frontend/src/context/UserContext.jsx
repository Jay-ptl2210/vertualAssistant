import React, { useState, useEffect, createContext } from 'react';
import axios from 'axios';

export const userDataContext = createContext();

function UserContext({ children }) {
  const serverUrl = "https://vertualassistantbackend.onrender.com";

  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [frontendImage, setFrontendImage] = useState(null);
  const [backendImage, setBackendImage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleCurrentUser = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/user/current`, {
        withCredentials: true,
      });

      setUserData(result.data.user);
      console.log("✅ Current user:", result.data.user);
    } catch (error) {
      console.error("❌ Failed to fetch user:", error);
    } finally {
      setIsLoading(false); // ✅ Mark loading complete
    }
  };

  const getGeminiResponse = async (command)=>{
    try {
      const result = await axios.post(`${serverUrl}/api/user/asktoassistant`,{command}, {withCredentials: true});
      return result.data;
    } catch (error) {
      console.error("❌ Failed to get Gemini response:", error);
      return { error: "Failed to get response from assistant." };
    }
  }

  useEffect(() => {
    handleCurrentUser();
  }, []);

  return (
    <userDataContext.Provider
      value={{
        serverUrl,
        userData,
        setUserData,
        isLoading,
        frontendImage,
        setFrontendImage,
        backendImage,
        setBackendImage,
        selectedImage,
        setSelectedImage,
        getGeminiResponse
      }}
    >
      {children}
    </userDataContext.Provider>
  );
}

export default UserContext;
