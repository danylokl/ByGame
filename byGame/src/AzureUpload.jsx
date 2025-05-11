import React, { useState } from 'react';
import { BlobServiceClient } from '@azure/storage-blob';

const AzureUpload = () => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');

  // const sasToken = "sv=2025-05-05&st=2025-03-25T15%3A16%3A01Z&se=2025-03-25T15%3A21%3A01Z&sr=b&sp=cw&sig=t54eYJujsfI9CGd16hhD1QFXMf0QBa2TLcDZBCBmy4w%3D";
  const sasToken = "sv=2025-05-05&st=2025-04-16T08%3A13%3A23Z&se=2080-07-31T16%3A20%3A13Z&sr=b&sp=racwdxy&sig=ByOAdR1YdvpaBPPAmNCuC82%2Bc5UmDLc%2FicGgOcTgbzs%3D";
  const storageAccountName = "moon3323232"; // 🔁 Заміни на свій
  const containerName = "hhh"; // 🔁 Заміни на свій

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const uploadFileToAzure = async () => {
    if (!file) {
      setStatus("Спочатку вибери файл.");
      return;
    }

    try {
      setStatus("Завантаження...");
      const blobServiceClient = new BlobServiceClient(
        `https://${storageAccountName}.blob.core.windows.net/?${sasToken}`
      );

      const containerClient = blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(file.name);

      await blockBlobClient.uploadBrowserData(file, {
        blobHTTPHeaders: { blobContentType: file.type }
      });

      setStatus("✅ Файл успішно завантажено!");
    } catch (err) {
      console.error(err);
      setStatus("❌ Помилка при завантаженні.");
    }
  };

  return (
    <div className="p-4 border rounded-md shadow-md max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-2">Завантаження на Azure Blob</h2>
      <input type="file" onChange={handleFileChange} className="mb-2" />
      <button
        onClick={uploadFileToAzure}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Завантажити
      </button>
      <p className="mt-2 text-sm">{status}</p>
    </div>
  );
};

export default AzureUpload;
