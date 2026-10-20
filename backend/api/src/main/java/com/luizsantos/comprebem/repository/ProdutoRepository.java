package com.luizsantos.comprebem.repository;

import com.luizsantos.comprebem.model.Produto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProdutoRepository extends JpaRepository<Produto, UUID> {

    // Busca com JPQL pelo nome ou descrição (ignorando maiúsculas/minúsculas)
    @Query("SELECT p FROM Produto p WHERE LOWER(p.nome) LIKE LOWER(CONCAT('%', :filtro, '%')) OR LOWER(p.descricao) LIKE LOWER(CONCAT('%', :filtro, '%'))")
    List<Produto> findByFiltro(@Param("filtro") String filtro);

    // Versão paginada da mesma busca JPQL caso utilize paginação com filtro
    @Query("SELECT p FROM Produto p WHERE LOWER(p.nome) LIKE LOWER(CONCAT('%', :filtro, '%')) OR LOWER(p.descricao) LIKE LOWER(CONCAT('%', :filtro, '%'))")
    Page<Produto> findByFiltro(@Param("filtro") String filtro, Pageable pageable);
}
