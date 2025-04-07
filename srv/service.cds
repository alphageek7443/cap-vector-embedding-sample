using {cap.vector.embedding as db} from '../db/schema';

service EmbeddingStorageService {
    
    entity Books                            as
        projection on db.Books
        excluding {
            embedding,
            embedding_openai
        };

    entity Search(query : String) as
        select from db.Books {
            ID,
            title,
            descr,
            cosine_similarity(
                embedding, to_real_vector(
                    vector_embedding(
                        :query, 'QUERY', 'SAP_NEB.20240715'
                    )
                )
            ) as cosine_similarity : String,
            l2distance(
                embedding, to_real_vector(
                    vector_embedding(
                        :query, 'QUERY', 'SAP_NEB.20240715'
                    )
                )
            ) as l2distance : String,
            0.0 as cosine_similarity_openai : String,
            0.0 as l2distance_openai : String
        }
        order by
            cosine_similarity desc
        limit 5;

}