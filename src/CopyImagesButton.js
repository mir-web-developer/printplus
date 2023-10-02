import React from "react";
import JSZip from "jszip";
import GetAppIcon from "@mui/icons-material/GetApp";
const CopyImagesButton = ({ images }) => {
  const handleDownloadImages = () => {
    // Создаем новый архив
    const zip = new JSZip();

    // Добавляем изображения в архив
    images.forEach((image, index) => {
      // Определите расширение на основе типа изображения, если это base64
      const extension = image.startsWith("data:image/png") ? "png" : "jpg";

      // Генерируем уникальное имя файла для каждой фотографии
      const filename = `Фотография_${index + 1}.${extension}`;

      // Добавляем изображение в архив
      zip.file(filename, image, { base64: false });
    });

    // Генерируем имя архива
    const zipFilename = "Фотографии.zip";

    // Генерируем архив и скачиваем его
    zip.generateAsync({ type: "blob" }).then((content) => {
      // Создаем ссылку для скачивания архива
      const url = window.URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = zipFilename;
      a.click();
    });
  };

  return (
    <div>
      <GetAppIcon
        color="primary"
        fontSize="large"
        onClick={handleDownloadImages}
      />
    </div>
  );
};

export default CopyImagesButton;
