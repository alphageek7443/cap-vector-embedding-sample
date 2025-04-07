const cds = require('@sap/cds')

module.exports = class EmbeddingStorageService extends cds.ApplicationService { init() {

  const { Books, Search } = cds.entities('EmbeddingStorageService')

  this.after (['CREATE', 'UPDATE'], Books, async (req) => {
    const embedding = await this.getEmbedding(req.descr);
    await UPDATE(Books, req.ID).with({
      embedding_openai: embedding,
    });
  })
 
  this.after ('READ', Search, async (searches,req) => {
    const [{ query: query }] = req.params;

    const scores = await this.getSimilaritySearch(query);
    searches.map((search) => {
      const score = scores.find((score) => score.ID === search.ID);
      search.cosine_similarity_openai = score.cosine_similarity_openai;
      search.l2distance_openai = score.l2distance_openai;
    });
    return searches;
  })


  return super.init()
}

getEmbedding = async (content) => {
  const vectorPlugin = await cds.connect.to("cap-llm-plugin");
  const embeddingModelConfig = await cds.env.requires["gen-ai-hub"][
    "text-embedding-ada-002"
  ];
  const embeddingGenResp = await vectorPlugin.getEmbeddingWithConfig(
    embeddingModelConfig,
    content
  );
  return embeddingGenResp?.data[0]?.embedding;
};

getSimilaritySearch = async (searchWord) => {
  var [cosineSimilarities, l2Distances] = await Promise.all([
    this.getSimilaritySearchForAlgorithm(searchWord, "COSINE_SIMILARITY"),
    this.getSimilaritySearchForAlgorithm(searchWord, "L2DISTANCE"),
  ]);

  return cosineSimilarities.map((item, i) =>
    Object.assign({}, item, l2Distances[i])
  );
};

getSimilaritySearchForAlgorithm = async (searchWord, algoName) => {
  const vectorPlugin = await cds.connect.to("cap-llm-plugin");
  const embedding = await this.getEmbedding(searchWord);
  const entity = cds.entities["Books"];
  const similaritySearchResults = await vectorPlugin.similaritySearch(
    entity.toString().toUpperCase(),
    entity.elements["embedding_openai"].name,
    entity.elements["descr"].name,
    embedding,
    algoName,
    5
  );

  return similaritySearchResults.map(result => {
    return Object.assign({}, {
      [algoName.toLowerCase() + "_openai"]: result.SCORE,
      "ID": result.ID
    });
  })
};

}

