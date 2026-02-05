const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Laci Digital API",
      version: "1.0.0",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Validasi gagal" },
            error: {
              type: "object",
              properties: {
                code: { type: "string", example: "VALIDATION_ERROR" },
                details: { type: "object", nullable: true },
              },
            },
          },
        },
        AuthTokens: {
          type: "object",
          properties: {
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
            expiresIn: { type: "integer", example: 1800 },
          },
        },
        UserProfile: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            role: { type: "string" },
            isActive: { type: "boolean" },
            emailVerified: { type: "string", nullable: true },
            image: { type: "string", nullable: true },
          },
        },
        Periode: {
          type: "object",
          properties: {
            id: { type: "string" },
            nama: { type: "string" },
            isActive: { type: "boolean" },
            userId: { type: "string" },
            createdAt: { type: "string" },
            updatedAt: { type: "string" },
          },
        },
        ArsipSurat: {
          type: "object",
          properties: {
            id: { type: "string" },
            nomorSurat: { type: "string" },
            jenisSurat: { type: "string", enum: ["MASUK", "KELUAR"] },
            organisasi: { type: "string", enum: ["IPNU", "IPPNU", "BERSAMA"], nullable: true },
            tanggalSurat: { type: "string" },
            penerimaPengirim: { type: "string" },
            perihal: { type: "string" },
            deskripsi: { type: "string", nullable: true },
            fileUrl: { type: "string", nullable: true },
            fileName: { type: "string", nullable: true },
            fileMime: { type: "string", nullable: true },
            fileSize: { type: "integer", nullable: true },
            userId: { type: "string" },
            periodeId: { type: "string", nullable: true },
            createdAt: { type: "string" },
            updatedAt: { type: "string" },
          },
        },
        PaginationMeta: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 10 },
            total: { type: "integer", example: 1 },
            totalPages: { type: "integer", example: 1 },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
