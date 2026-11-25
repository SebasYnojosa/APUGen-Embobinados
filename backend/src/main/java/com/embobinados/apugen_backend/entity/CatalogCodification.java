package com.embobinados.apugen_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "catalog_codifications")
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
public class CatalogCodification extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "codigo", nullable = false, unique = true, length = 3)
    private String code;

    @Column(name = "descripcion", nullable = false, length = 255)
    private String description;

    @Column(name = "tipo", nullable = false, length = 10)
    private String type; // "mat", "equ", "mdo"
}
