package com.example;

// import java.nio.charset.StandardCharsets;
// import java.sql.Date;
// import java.util.HashMap;
// import java.util.Map;

// import javax.crypto.SecretKey;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

// import io.jsonwebtoken.Claims;
// import io.jsonwebtoken.Jwts;
// import io.jsonwebtoken.security.Keys;

@SpringBootTest
class DemoApplicationTests {

	@Test
	public void contextLoads() {
	}

	// @Test
	// public void testGenJwt() {
	// Map<String, Object> claims = new HashMap<>();
	// claims.put("id", 1);
	// claims.put("name", "tom");
	// String secret = "jotangnote-secret-key-2952703082";
	// SecretKey secretKey =
	// Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));

	// String jwt = Jwts.builder()
	// .subject(null)
	// .expiration(new Date(System.currentTimeMillis() + 7L * 24 * 3600 * 1000))
	// .claims(claims)
	// .signWith(secretKey, Jwts.SIG.HS256)
	// .compact();
	// System.out.println(jwt);
	// }

	// @Test
	// public void testParseJwt() {
	// String secret = "jotangnote-secret-key-2952703082";
	// SecretKey secretKey =
	// Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
	// Map<String, Object> claims = new HashMap<>();
	// claims.put("id", 1);
	// claims.put("name", "tom");
	// Claims claim = Jwts.parser()
	// .verifyWith(secretKey)
	// .build()
	// .parseSignedClaims(
	// "eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3OTA3NjgyNzIsIm5hbWUiOiJ0b20iLCJpZCI6MX0.uNP55TloPvadhhhuW33tQ7dzvZxyifWrJT9ljlG5V1w")
	// .getPayload();
	// System.out.println(claim);
	// }
}
