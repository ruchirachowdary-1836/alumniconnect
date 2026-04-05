package com.alumnilink.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping(value = "/", produces = MediaType.TEXT_HTML_VALUE)
    public String home() {
        return """
            <!doctype html>
            <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Alumni Link Backend</title>
              <style>
                body {
                  margin: 0;
                  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
                  background: #f6f8fb;
                  color: #1f2937;
                }
                .wrap {
                  max-width: 760px;
                  margin: 48px auto;
                  padding: 24px;
                  background: #fff;
                  border: 1px solid #e5e7eb;
                  border-radius: 12px;
                }
                h1 { margin: 0 0 8px; }
                p { margin: 8px 0; }
                code {
                  background: #f3f4f6;
                  padding: 2px 6px;
                  border-radius: 6px;
                }
                ul { margin-top: 12px; }
              </style>
            </head>
            <body>
              <div class="wrap">
                <h1>Alumni Link Backend is running</h1>
                <p>This is the Spring Boot API server.</p>
                <ul>
                  <li>Login endpoint: <code>POST /api/auth/login</code></li>
                  <li>Register endpoint: <code>POST /api/auth/register</code></li>
                </ul>
              </div>
            </body>
            </html>
            """;
    }
}
