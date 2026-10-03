using InventoryApi.DTOs;
using InventoryApi.Models;
using InventoryApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(IProductService productService, ILogger<ProductsController> logger)
    {
        _productService = productService;
        _logger = logger;
    }

    /// <summary>
    /// Retrieve products list with optional search and category filters
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<Product>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<Product>>> Get([FromQuery] string? search, [FromQuery] string? category)
    {
        var products = await _productService.GetAllAsync(search, category);
        return Ok(products);
    }

    /// <summary>
    /// Get a single product by its MongoDB ObjectId
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(Product), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Product>> GetById(string id)
    {
        var product = await _productService.GetByIdAsync(id);
        if (product == null)
        {
            return NotFound(new { message = $"Product with ID '{id}' was not found." });
        }

        return Ok(product);
    }

    /// <summary>
    /// Add a new product to inventory
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(Product), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Product>> Create([FromBody] CreateProductDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var created = await _productService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>
    /// Update an existing product
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(Product), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Product>> Update(string id, [FromBody] UpdateProductDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var updated = await _productService.UpdateAsync(id, dto);
        if (updated == null)
        {
            return NotFound(new { message = $"Product with ID '{id}' was not found." });
        }

        return Ok(updated);
    }

    /// <summary>
    /// Delete a product from inventory
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(string id)
    {
        var deleted = await _productService.DeleteAsync(id);
        if (!deleted)
        {
            return NotFound(new { message = $"Product with ID '{id}' was not found." });
        }

        return NoContent();
    }

    /// <summary>
    /// Update stock level (add, remove, or set quantity)
    /// </summary>
    [HttpPatch("{id}/stock")]
    [ProducesResponseType(typeof(Product), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Product>> UpdateStock(string id, [FromBody] StockUpdateDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var updated = await _productService.UpdateStockAsync(id, dto);
            if (updated == null)
            {
                return NotFound(new { message = $"Product with ID '{id}' was not found." });
            }

            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Retrieve products that are currently at or below their low-stock threshold
    /// </summary>
    [HttpGet("low-stock")]
    [ProducesResponseType(typeof(List<Product>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<Product>>> GetLowStock()
    {
        var lowStock = await _productService.GetLowStockAsync();
        return Ok(lowStock);
    }

    /// <summary>
    /// Retrieve distinct product categories
    /// </summary>
    [HttpGet("categories")]
    [ProducesResponseType(typeof(List<string>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<string>>> GetCategories()
    {
        var categories = await _productService.GetCategoriesAsync();
        return Ok(categories);
    }

    /// <summary>
    /// Retrieve aggregated dashboard statistics
    /// </summary>
    [HttpGet("stats")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboardStats()
    {
        var stats = await _productService.GetDashboardStatsAsync();
        return Ok(stats);
    }
}