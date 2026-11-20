package com.embobinados.apugen_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "processes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Process {
    @Id
    @Column(name = "service_request", length = 20)
    private String serviceRequest; // ID Manual (Solicitud de Servicio / Obra)

    @ManyToOne
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "main_process", nullable = false, length = 100)
    private String mainProcess;

    @Column(length = 50)
    private String power;

    @Column(length = 100)
    private String serial;

    @Column(length = 100)
    private String brand;

    @Column(length = 100)
    private String location;

    @OneToMany(mappedBy = "process", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProcessService> services = new ArrayList<>();
}