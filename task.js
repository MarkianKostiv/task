const axios = require("axios");
const cheerio = require("cheerio");

const chunkArray = (array, size) => {
  const chunkedArr = [];
  for (let i = 0; i < array.length; i += size) {
    chunkedArr.push(array.slice(i, i + size));
  }
  return chunkedArr;
};

const scanLinks = async (pageUrl) => {
  try {
    const response = await axios.get(pageUrl);
    const $ = cheerio.load(response.data);
    const offerLinks = $(".offer-card a.offer-card__image-container")
      .map((index, element) => $(element).attr("href"))
      .get();
    return offerLinks;
  } catch (error) {
    console.error("Error fetching website:", error);
    return [];
  }
};

const scanCarInfo = async (offerLinks) => {
  const allCarsData = [];
  for (const offerLink of offerLinks) {
    try {
      const response = await axios.get(
        `https://www.icarros.com.br${offerLink}`
      );
      const $ = cheerio.load(response.data);
      const carInfo = $(".pagecontent")
        .map((index, element) => ({
          offer_url: offerLink,
          title: $(".titulo-sm", element).first().text().trim(),
          price: $(".preco", element).first().text().trim(),
          car_year: $(".destaque", element).eq(0).text().trim(),
          car_millage: $(".destaque", element).eq(1).text().trim(),
          color: $(".destaque", element).eq(2).text().trim(),
        }))
        .get();
      allCarsData.push(...carInfo);
    } catch (error) {
      console.error("Error fetching website:", error);
    }
  }
  return allCarsData;
};

const getAllPagesLinks = async (pagesNumber) => {
  const allLinks = [];
  for (let pageNumber = 2; pageNumber <= pagesNumber; pageNumber++) {
    const pageUrl = `https://www.icarros.com.br/ache/listaanuncios.jsp?pag=${pageNumber}&ord=35&sop=nta_17|44|51.1_-mar_36.1_-mod_480.1_-sta_1.1_`;
    const offerLinks = await scanLinks(pageUrl);
    allLinks.push(...offerLinks);
  }
  return allLinks;
};

const getCarInfo = async () => {
  console.time("myTimer");
  const initialOfferLinks = await scanLinks(
    "https://www.icarros.com.br/comprar/volkswagen/gol?reg=city"
  );
  const allOfferLinks = await getAllPagesLinks(10);
  const allLinks = [...initialOfferLinks, ...allOfferLinks];

  const chunkedLinks = chunkArray(allLinks, 10);

  const promises = chunkedLinks.map(scanCarInfo);

  const allCarsData = await Promise.all(promises);

  console.log(allCarsData.flat());

  console.timeEnd("myTimer");
};

getCarInfo();
