import './App.css'
import { PixiSlot } from './components/PixiSlot';
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';

function App() {
 
  return (
    <Router>
      <div className="container my-4">
        <nav className="mb-3">
          {/* Кнопка "Головна" веде на "/" (GetJwtPage) */}
          <Link to="/" className="btn btn-dark me-2">Login (Get JWT)</Link>

          <Link to="/generate" className="btn btn-primary me-2">Generate</Link>
          <Link to="/metadata" className="btn btn-secondary me-2">Metadata</Link>
          <Link to="/mynfts" className="btn btn-info me-2">My NFTs</Link>
          <Link to="/slot" className="btn btn-success">Slot</Link>
        </nav>

        <Routes>
          {/* 1) Дефолтний маршрут ("/") – GetJwtPage */}
          <Route path="/" element={<GetJwtPage />} />

          {/* 2) Решта сторінок */}
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/metadata" element={<MetadataPage />} />
          <Route path="/mynfts" element={<MyNftsPage />} />
          <Route path="/slot" element={<SlotPage />} />
        </Routes>
      </div>
    </Router>
  );

  
  // return (
  //   <div style={{ width: '100vw', height: '100vh' }}>
  //     <PixiSlot />
  //   </div>
  // )
}


function GetJwtPage() {
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleGetToken() {
    try {
      setLoading(true);
      setError(null);

      // Викликаємо GET на ваш ендпоінт
      const response = await axios.get('https://localhost:7273/api/Account/GetJWT');
      // Припустимо, що бек повертає чистий рядок із JWT:
      const jwt = response.data;

      setToken(jwt);
      // Зберігаємо JWT у localStorage:
      localStorage.setItem('jwtToken', jwt);

    } catch (err) {
      console.error('Помилка отримання JWT:', err);
      setError('Не вдалося отримати токен. Перевірте бекенд або CORS.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Get JWT (Login)</h2>
      <p>Натисніть кнопку, щоб отримати токен від бекенда і зберегти його у localStorage.</p>
      <button className="btn btn-primary" onClick={handleGetToken} disabled={loading}>
        {loading ? 'Loading...' : 'Get Token'}
      </button>

      {error && <div className="alert alert-danger mt-3">{error}</div>}
      {token && (
        <div className="alert alert-success mt-3">
          <p>Отримано токен:</p>
          <code>{token}</code>
        </div>
      )}
    </div>
  );
}



function GeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiImageUrl, setAiImageUrl] = useState(null);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setAiImageUrl(null);

      // Припустимо, у нас збережений токен у localStorage під ключем "jwtToken"
      const token = localStorage.getItem('jwtToken');

      const response = await axios.post(
        'https://localhost:7273/api/NftCommand/GeneratePhotoByAi',
        prompt,  // тіло (можна як об'єкт, залежно від беку)
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Припустимо, що бек повертає нам URL у .data (рядок)
      const imageUrl = response.data;
      setAiImageUrl(imageUrl);

      // Зберігаємо в localStorage, щоб потім підставити у MetadataPage
      localStorage.setItem('aiImageUrl', imageUrl);

    } catch (error) {
      console.error('Помилка GeneratePhotoByAi:', error);
      alert('Помилка при генерації зображення');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Generate AI Photo</h2>
      <div className="mb-3">
        <label>Enter your prompt:</label>
        <input
          type="text"
          className="form-control"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>
      <button
        className="btn btn-primary"
        onClick={handleGenerate}
        disabled={loading || !prompt}
      >
        {loading ? 'Generating...' : 'Generate'}
      </button>

      {loading && <div className="mt-3">Будь ласка, зачекайте, йде генерація...</div>}

      {aiImageUrl && (
        <div className="mt-3">
          <p>Згенероване зображення:</p>
          <img
            src={aiImageUrl}
            alt="AI result"
            style={{ maxWidth: '700px', maxHeight: '700px' }}
          />
        </div>
      )}
    </div>
  );
}

function MetadataPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    Symbol: '',
    Category: '',
    Price: '',
    Name: '',
    Description: '',
    ImgType: '',
    PrivateNft: false,
    Attributes: '{"trait_type":"string","value":"string"}'
  });

  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState(null);

  const aiImageUrl = localStorage.getItem('aiImageUrl') || '';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setResponseData(null);

      const token = localStorage.getItem('jwtToken');

      // Формуємо formData (як Multipart/Form-Data)
      const form = new FormData();
      form.append('NftDetails.Symbol', formData.Symbol);
      form.append('NftDetails.Category', formData.Category);
      form.append('Price', formData.Price);
      form.append('NftDetails.Name', formData.Name);
      form.append('NftDetails.Description', formData.Description);
      form.append('NftDetails.ImgType', formData.ImgType);
      form.append('NftDetails.ImagePath', aiImageUrl);
      form.append('PrivateNft', formData.PrivateNft);
      form.append('NftDetails.Attributes', formData.Attributes);

      // Приклад: POST https://localhost:7273/api/NftCommand/???
      // (Замініть на потрібний endpoint, можливо: /api/NftCommand/CreateNft)
      const resp = await axios.post(
        'https://localhost:7273/api/NftCommand/CreateNft',
        form,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setResponseData(resp.data);
      console.log('Metadata response:', resp.data);

    } catch (error) {
      console.error('Помилка при надсиланні метаданих:', error);
      alert('Помилка при створенні Nft');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>NFT Metadata</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label>Symbol:</label>
          <input
            name="Symbol"
            className="form-control"
            value={formData.Symbol}
            onChange={handleChange}
          />
        </div>
        <div className="mb-2">
          <label>Category:</label>
          <input
            name="Category"
            className="form-control"
            value={formData.Category}
            onChange={handleChange}
          />
        </div>
        <div className="mb-2">
          <label>Price:</label>
          <input
            name="Price"
            type="number"
            className="form-control"
            value={formData.Price}
            onChange={handleChange}
          />
        </div>
        <div className="mb-2">
          <label>Name:</label>
          <input
            name="Name"
            className="form-control"
            value={formData.Name}
            onChange={handleChange}
          />
        </div>
        <div className="mb-2">
          <label>Description:</label>
          <input
            name="Description"
            className="form-control"
            value={formData.Description}
            onChange={handleChange}
          />
        </div>
        <div className="mb-2">
          <label>ImgType:</label>
          <input
            name="ImgType"
            className="form-control"
            value={formData.ImgType}
            onChange={handleChange}
          />
        </div>
        <div className="mb-2">
          <label>PrivateNft: </label>
          <input
            type="checkbox"
            name="PrivateNft"
            className="form-check-input ms-2"
            checked={formData.PrivateNft}
            onChange={handleChange}
          />
        </div>
        <div className="mb-2">
          <label>Attributes (JSON):</label>
          <input
            name="Attributes"
            className="form-control"
            value={formData.Attributes}
            onChange={handleChange}
          />
        </div>

        {/* Показуємо, яке зображення плануємо записати */}
        {aiImageUrl && (
          <div className="mt-3">
            <p>Зображення з першого кроку:</p>
            <img src={aiImageUrl} alt="AI" style={{ maxWidth: '300px' }} />
          </div>
        )}

        <button type="submit" className="btn btn-primary mt-2" disabled={loading}>
          {loading ? 'Saving...' : 'Submit Metadata'}
        </button>
      </form>

      {responseData && (
        <div className="alert alert-success mt-3">
          <p>Отримали відповідь:</p>
          <pre>{JSON.stringify(responseData, null, 2)}</pre>
          <button className="btn btn-secondary" onClick={() => {
            // Після успішного створення – можна піти до MyNFTs
            navigate('/mynfts');
          }}>
            Перейти до списку NFT
          </button>
        </div>
      )}
    </div>
  );
}

function MyNftsPage() {
  const [userName, setUserName] = useState('Ivan');
  const [loading, setLoading] = useState(false);
  const [nfts, setNfts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const navigate = useNavigate();

  const handleFetch = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');

      const resp = await axios.get(
        `https://localhost:7273/api/NftQuery/GetAccountNftIdsAsync?userName=${userName}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setNfts(resp.data);
    } catch (error) {
      console.error('Помилка отримання NFT:', error);
      alert('Помилка завантаження списку NFT');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckbox = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleGoToSlot = () => {
    // Витягуємо ImagePath тих NFT, які обрані
    const selectedNfts = nfts.filter((nft) => selectedIds.includes(nft.id));
    const imagePaths = selectedNfts.map((n) => n.imagePath);

    // Збережемо ці шляхи в localStorage, щоб SlotPage міг їх підхопити
    // localStorage.setItem('selectedNftImages', JSON.stringify(imagePaths));

    // Переходимо на /slot
    navigate('/slot', { state: { images: imagePaths } });

  };

  return (
    <div>
      <h2>My NFTs</h2>
      <div className="d-flex mb-2">
        <input
          className="form-control me-2"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="UserName"
        />
        <button className="btn btn-primary" onClick={handleFetch} disabled={loading}>
          {loading ? 'Loading...' : 'Fetch NFTs'}
        </button>
      </div>

      <div>
        {nfts.map((nft) => (
          <div key={nft.id} className="border p-2 mb-2 d-flex">
            <input
              type="checkbox"
              className="form-check-input me-2"
              checked={selectedIds.includes(nft.id)}
              onChange={() => handleCheckbox(nft.id)}
            />
            <div>
              <div><b>ID:</b> {nft.id}</div>
              <div><b>Name:</b> {nft.name}</div>
              <div><b>Symbol:</b> {nft.symbol}</div>
              <div><b>Mint:</b> {nft.mint}</div>
              {nft.imagePath && (
                <img
                  src={nft.imagePath}
                  alt={nft.name}
                  style={{ maxWidth: '200px', maxHeight: '200px' }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {nfts.length > 0 && (
        <button
          className="btn btn-success"
          onClick={handleGoToSlot}
          disabled={selectedIds.length === 0}
        >
          Перейти до слота з вибраними NFT
        </button>
      )}
    </div>
  );
}


function SlotPage() {

  const location = useLocation();
  const images = location.state?.images ?? [];

  // const [images, setImages] = useState([]);

  return (
    <div>
      <h2>Slot Machine</h2>
      <PixiSlot imageUrls={images} />
    </div>
  );
}





export default App
