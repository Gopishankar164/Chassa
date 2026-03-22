package com.aaradhana.aaradhana.config;

import com.aaradhana.aaradhana.model.User;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;
import org.springframework.data.mongodb.core.convert.MappingMongoConverter;
import org.springframework.data.mongodb.core.convert.DefaultMongoTypeMapper;
import org.springframework.data.mongodb.core.convert.DefaultDbRefResolver;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.lang.NonNull;

import java.util.Arrays;

@Configuration
public class MongoConfig {

    @Bean
    public MongoCustomConversions customConversions() {
        return new MongoCustomConversions(Arrays.asList(
            new StringToCartItemConverter()
        ));
    }

    @Bean
    public MappingMongoConverter mappingMongoConverter(MongoDatabaseFactory factory, MongoMappingContext context, MongoCustomConversions conversions) {
        
        DefaultDbRefResolver dbRefResolver = new DefaultDbRefResolver(factory);
        MappingMongoConverter mappingConverter = new MappingMongoConverter(dbRefResolver, context);
        
        mappingConverter.setTypeMapper(new DefaultMongoTypeMapper(null));
        mappingConverter.setCustomConversions(conversions);
        mappingConverter.afterPropertiesSet();
        
        return mappingConverter;
    }

    public static class StringToCartItemConverter implements Converter<String, User.CartItem> {
        public User.CartItem convert(@NonNull String source) {
            User.CartItem cartItem = new User.CartItem();
            cartItem.setProductId(source);
            cartItem.setQuantity(1);
            cartItem.setSelectedSize(null);
            cartItem.setSelectedColor(null);
            return cartItem;
        }
    }
}
